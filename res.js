import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { db } from './config/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  getDocs,
  updateDoc,
  setDoc,
  doc,
} from 'firebase/firestore';
import Swiper from 'react-native-swiper';
import UserContext from './UserContext';
import firebase from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
const SLOT_PRICE = 30;

export default function ReservationScreen({ route }) {
  const { item } = route.params;
  const navigation = useNavigation();
  const { user } = useContext(UserContext);
  const [email, setEmail] = useState(user?.email || '');
  const [plateNumber, setPlateNumber] = useState(user?.carPlateNumber || '');
  const [slotSets, setSlotSets] = useState([]);
  const [reservedSlots, setReservedSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSlotReserved, setIsSlotReserved] = useState(false);
  const [reservations, setReservations] = useState([]);


  useEffect(() => {
    const reservationsRef = collection(db, 'reservations');
    const unsubscribe = onSnapshot(reservationsRef, (snapshot) => {
      const reservationData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReservations(reservationData);
    });

    return () => {
      unsubscribe();
    };
  }, []);
  
  useEffect(() => {
    const loadReservedSlots = async () => {
      try {
        const storedReservedSlots = await AsyncStorage.getItem('reservedSlots');
        if (storedReservedSlots) {
          setReservedSlots(JSON.parse(storedReservedSlots));
        }
      } catch (error) {
        console.error('Error loading reserved slots from AsyncStorage:', error);
      }
    };

    loadReservedSlots();
  }, []);

  useEffect(() => {
    const saveReservedSlots = async () => {
      try {
        await AsyncStorage.setItem('reservedSlots', JSON.stringify(reservedSlots));
      } catch (error) {
        console.error('Error saving reserved slots to AsyncStorage:', error);
      }
    };

    saveReservedSlots();
  }, [reservedSlots]);

  // useEffect(() => {
  //   const reservationsRef = collection(db, 'reservations');
  //   const unsubscribe = onSnapshot(reservationsRef, (snapshot) => {
  //     const reservationData = snapshot.docs.map((doc) => ({
  //       id: doc.id,
  //       ...doc.data(),
  //     }));
  //     setReservations(reservationData);
  //   });
  
  //   return () => {
  //     // Clear local storage on component unmount
  //     AsyncStorage.removeItem('reservedSlots')
  //       .then(() => console.log('Local storage cleared on component unmount'))
  //       .catch(error => console.error('Error clearing local storage:', error));
  //   }
  // }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.email) {
        const userRef = doc(db, "users", user.email); 
        try {
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            const userData = docSnap.data();
            console.log("Fetched user data:", userData);
            setPlateNumber(userData.carPlateNumber);
          } else {
            console.log("No such user document!");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };
  
    fetchUserData();
  }, [user?.email]);
  
  

    useEffect(() => {
      if (!user) {
        console.log("Waiting for user data to load or user is not logged in");
      } else {
        setEmail(user.email);
        setPlateNumber(user.carPlateNumber);
      }
    }, [user, navigation]);
    

    useEffect(() => {
      if (!user) {
        console.log("Waiting for user data to load or user is not logged in");
      } else {
        setEmail(user.email);
        setPlateNumber(user.carPlateNumber);
      }
  }, [user]);

    useEffect(() => {
      const auth = getAuth();
      const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
          if (firebaseUser) {
              setEmail(firebaseUser.email);
              setPlateNumber(firebaseUser.carPlateNumber); 
          } else {
              console.log("User is not logged in");
          }
      });

      const establishmentQuery = query(collection(db, 'establishments'), where('managementName', '==', item.managementName));
      const unsubscribeSlots = onSnapshot(establishmentQuery, (snapshot) => {
        if (!snapshot.empty) {
          const establishmentData = snapshot.docs[0].data();
          console.log("Establishment data:", establishmentData);
          setSlotSets(processEstablishmentData(establishmentData));
        } else {
          console.log('Establishment data not found');
        }
        setIsLoading(false);
      }, (error) => {
        console.error('Error fetching real-time data:', error);
        setIsLoading(false);
        
      });
    
      return () => {
        unsubscribeSlots();
      };
    }, [item.managementName]);



  
    const processEstablishmentData = (establishmentData) => {
      let newSlotSets = [];
      let slotCounter = 0; 
      let slotIndex = slotCounter;
    
      if (Array.isArray(establishmentData.floorDetails) && establishmentData.floorDetails.length > 0) {
        establishmentData.floorDetails.forEach((floor) => {
          const floorSlots = Array.from({ length: parseInt(floor.parkingLots) }, (_, i) => ({
            id: `${floor.floorName}-${i + 1}`,
            floor: floor.floorName,
            slotNumber: ++slotCounter,
            occupied: false, 
            slotIndex,
          }));
    
          newSlotSets.push({
            title: floor.floorName,
            slots: floorSlots,
          });
        });
      }
    
      else if (establishmentData.totalSlots) {
        const generalParkingSet = {
          title: 'General Parking',
          slots: Array.from({ length: parseInt(establishmentData.totalSlots) }, (_, i) => ({
            id: `General Parking-${i}`,
            floor: 'General',
            slotNumber: ++slotCounter,
            occupied: false,
          })),
        };
    
        newSlotSets.push(generalParkingSet);
      }
    
      return newSlotSets;
    };
    
    
    const reserveSlot = (slotNumber) => {
      if (reservedSlots.includes(slotNumber)) {
        Alert.alert(
          'Confirmation',
          `Are you sure you want to cancel the reservation for Slot ${slotNumber}?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'OK',
              onPress: () => {
                setReservedSlots((prevSlots) => prevSlots.filter((slot) => slot !== slotNumber));
                setSelectedSlot();
                Alert.alert('Reservation Canceled', `Reservation for Slot ${slotNumber} canceled successfully!`);
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        // Check if the user has already reserved a slot
        if (reservedSlots.length > 0) {
          Alert.alert('Reservation Limit', 'You can only reserve one slot at a time.', [
            {
              text: 'OK',
              style: 'default',
            },
          ]);
        } else {
          setSelectedSlot(slotNumber);
        }
      }
    };
    
      useEffect(() => {
        const slotDataRef = collection(db, 'slot', item.managementName, 'slotData');
        const resDataRef = collection(db, 'res', item.managementName, 'resData');
    
        let fetchedSlotData = new Map();
        let fetchedResData = new Map();
    
        // Process slotData
        const processSlotData = (querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const docName = doc.id;
                const [prefix, floor, index] = docName.split('_');
                if (prefix === 'slot' && floor && index !== undefined) {
                    const combinedId = `${floor}-${index}`;
                    fetchedSlotData.set(combinedId, doc.data().status);
                }
            });
        };
    
        // Process resData
        const processResData = (querySnapshot) => {
          querySnapshot.forEach((doc) => {
              const data = doc.data();
              const status = data.status;
              const slotId = data.slotId;
              fetchedResData.set(slotId, status);
          });
      };
    
        // Subscribe to slotData
        const unsubscribeSlot = onSnapshot(slotDataRef, (querySnapshot) => {
            processSlotData(querySnapshot);
            updateSlotSets();
        });
    
        // Subscribe to resData
        const unsubscribeRes = onSnapshot(resDataRef, (querySnapshot) => {
            processResData(querySnapshot);
            updateSlotSets();
        });
    
        // Function to update slotSets state
        const updateSlotSets = () => {
          setSlotSets((currentSlotSets) => {
              return currentSlotSets.map((floor) => {
                  return {
                      ...floor,
                      slots: floor.slots.map((slot, index) => {
                          const combinedId = `${floor.title}-${index}`; 
                          const slotIdGeneral = `General Parking_${slot.slotNumber}`; 
                          const slotIdLetter = `${floor.title.toLowerCase()}_${slot.slotNumber}`; 
                          const isOccupied = fetchedSlotData.get(combinedId) === 'Occupied' ||
                                             fetchedResData.get(slotIdGeneral) === 'Occupied' ||
                                             fetchedResData.get(slotIdLetter) === 'Occupied';
                          return {
                              ...slot,
                              occupied: isOccupied,
                          };
                      }),
                  };
              });
          });
      };
    
        // Cleanup function
        return () => {
            unsubscribeSlot();
            unsubscribeRes();
        };
    }, [db, item.managementName]);
  
    
  const handleReservation = async () => {
    if (selectedSlot !== null && !reservedSlots.includes(selectedSlot)) {
      Alert.alert(
        'Confirm Reservation',
        `Are you sure you want to reserve Slot ${selectedSlot}`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'OK',
            onPress: async () => {
              // Find the floor title for the selected slot
              let floorTitle =  "General Parking";
              slotSets.forEach(set => {
                if (set.slots.some(slot => slot.slotNumber === selectedSlot)) {
                  floorTitle = set.title;
                }
              });
  
              const uniqueSlotId = `${floorTitle}_${selectedSlot}`;
  
              const reservationData = {
                userEmail: email,
                plateNumber: plateNumber || '',
                slotId: uniqueSlotId,
                managementName: item.managementName,
                timestamp: new Date (), 
                status: 'Reserved', 
              };
  
              try {
               
                const reservationsRef = collection(db, 'reservations');
                await setDoc(doc(reservationsRef, uniqueSlotId), reservationData, { merge: true });
  
                setReservedSlots([...reservedSlots, selectedSlot]);
                setSelectedSlot(null);
                Alert.alert('Reservation Successful', `Slot ${selectedSlot} reserved successfully!`);
              } catch (error) {
                console.error('Error saving reservation:', error);
                Alert.alert('Reservation Failed', 'Could not complete your reservation. Please try again.');
              }
            },
          },
        ],
        { cancelable: false }
      );
    } else {
      Alert.alert('Invalid Reservation', 'Please select a valid slot before reserving.', [
        { text: 'OK', style: 'default' },
      ]);
    }
  };    
  
  const collectUserInfo = (slotId) => {
    const auth = getAuth();
    const user = auth.currentUser;
  
    if (user !== null) {
      const userEmail = user.email;
  
      // Prompt for car plate number
      Alert.prompt(
        'Confirm your plate number',
        '',
        (userCarPlate) => {
          confirmReservation(slotId, userEmail, userCarPlate);
        }
      );
    } else {
      Alert.alert('Not Logged In', 'You need to be logged in to make a reservation.', [{ text: 'OK', style: 'default' }]);
    }
  };
  
  const confirmReservation = async (slotId, userEmail, userCarPlate) => {
    const reservationData = {
      email: userEmail,
      carPlate: userCarPlate,
      slotId: slotId,
      managementName: item.managementName,
      timestamp: new Date(),
      occupied: true,
    };

    try {
      
      const reservationsRef = collection(db, 'reservations');
    await addDoc(reservationsRef, reservationData);
      setReservedSlots([...reservedSlots, slotId]);
      setSelectedSlot(slotId);
      Alert.alert(
        'Reservation Successful',
        `Slot ${slotId} reserved successfully!`,
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error) {
      console.error('Error saving reservation:', error);
      Alert.alert(
        'Reservation Failed',
        'Could not save your reservation. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const cancelReservation = async (cancelledSlot) => {
    const userEmail = user?.email;
  
    if (!userEmail) {
      Alert.alert('Error', 'User email is not available. Cannot proceed with cancellation.', [{ text: 'OK', style: 'default' }]);
      return;
    }
  
    try {
      const q = query(collection(db, 'reservations'), where('slotId', '==', cancelledSlot), where('email', '==', userEmail));
      const querySnapshot = await getDocs(q);
  
      querySnapshot.forEach(async (doc) => {
        // Update the document to mark the slot as unoccupied
        await updateDoc(doc.ref, { occupied: false });
  
        // Delete the document
        await deleteDoc(doc.ref);
      });
  
      setReservedSlots((prevSlots) => prevSlots.filter((slot) => slot !== cancelledSlot));
      setSelectedSlot(null);
      Alert.alert('Reservation Canceled', `Reservation for Slot ${cancelledSlot} canceled successfully!`);
    } catch (error) {
      console.error('Error canceling reservation:', error);
      Alert.alert('Cancellation Failed', 'Could not cancel your reservation. Please try again.', [{ text: 'OK', style: 'default' }]);
    }
  };
  
  const totalAmount = reservedSlots.length * SLOT_PRICE;
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {isLoading ? (
          <Text>Loading slots...</Text>
        ) : (
          slotSets.map((floor, index) => (
            <View key={index} style={styles.floorContainer}>
              <Text style={styles.floorTitle}>{floor.title}</Text>
              <View style={styles.slotContainer}>
              {floor.slots.map((slot) => (
  <TouchableOpacity
    key={slot.id}
    style={[
      styles.slotButton,
      slot.occupied && styles.occupiedSlotButton,
      selectedSlot === slot.slotNumber && styles.highlightedSlotButton, 
    ]}
    onPress={() => reserveSlot(slot.slotNumber)}
    disabled={slot.occupied}
  >
    <Text style={styles.slotButtonText}>{slot.slotNumber}</Text>
  </TouchableOpacity>
))}
              </View>
            </View>
          ))
        )}
        {isSlotReserved && (
          <View>
            <Text>Reserved Slot: {selectedSlot}</Text>
          </View>
        )}

        {/* Reserve Button */}
        <Button
          title="Reserve Slot"
          onPress={handleReservation}
          color="#2ecc71"
          accessibilityLabel="Reserve your selected parking slot"
        />
        {reservedSlots.length > 0 && (
          <View>
            <Text style={styles.reservedSlotsText}>Slot Reservation Request:</Text>
            <Text>STATUS: Pending.....</Text>
              {reservedSlots.map((reservedSlot) => (
                <View key={reservedSlot}style={styles.reservedSlotButton}>
                  <Text style={styles.slotButtonText}>{reservedSlot}</Text>
                </View>
              ))}
               <View style={styles.slotContainer}>
            </View>
          </View>
        )}
        {reservedSlots.length > 0 && (
          <Text style={styles.totalAmountText}>
            Total Amount: PHP{totalAmount}
          </Text>
        )}
      </View>
    </ScrollView>
);
}


const styles = StyleSheet.create({

  vacantSlotButton: {
    backgroundColor: '#3498db',
  },
  occupiedSlotButton: {
    backgroundColor: 'red',
  },
  clickedSlotButton: {
    backgroundColor: '#27ae60',
  },
  reservedSlotButton: {
    backgroundColor: 'red',
  },

  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  zoneTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  floorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  slotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  slotButton: {
    backgroundColor: 'green',
    padding: 20,
    margin: 10,
    borderRadius: 10,
    width: 80,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },

  slotButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  reserveButton: {
    backgroundColor: '#2ecc71',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  totalAmountText: {
    fontSize: 16,
    marginTop: 10,
  },
  reservedSlotsText: {
    fontSize: 16,
    marginTop: 20,
  },
  highlightedSlotButton: {
    borderWidth: 3,
    borderColor: 'red',
  },
});