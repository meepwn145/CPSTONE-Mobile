import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  Button,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { db } from "./config/firebase";
import { Animated } from "react-native";
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
  getDoc,
} from "firebase/firestore";
import Swiper from "react-native-swiper";
import UserContext from "./UserContext";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LocationStore, ReservationStore } from "./store";
import { useStoreState } from "pullstate";
import RNPickerSelect from "react-native-picker-select";
import * as ImagePicker from "expo-image-picker";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { v4 as uuidv4 } from "uuid"; // If using UUID
import { auth } from "./config/firebase";
import { fetchData, fetchReservation, fetchSlotData } from "./helper/helper";

const SLOT_PRICE = 30;

export default function ReservationScreen({ route }) {
  const {
    item,
    selectedFloor: initialSelectedFloor,
    selectedSlot: initialSelectedSlot,
  } = route.params;
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const navigation = useNavigation();
  const { user } = useContext(UserContext);
  const [email, setEmail] = useState(user?.email || "");
  const [plateNumber, setPlateNumber] = useState(user?.carPlateNumber || "");
  const [slotSets, setSlotSets] = useState([]);
  const [reservedSlots, setReservedSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reservationStatus, setReservationStatus] = useState("");
  const [isSlotReserved, setIsSlotReserved] = useState(false);
  const [reservations, setReservations] = useState([]);
  const location = useStoreState(LocationStore);
  const [reservationManagement, setReservationManagement] = useState("");
  const [managementPrice, setManagementPrice] = useState(0);
  const [alertShown, setAlertShown] = useState(false);
  const [fee, setFee] = useState("");
  const [reservationId, setReservationId] = useState("");
  const reservationDetails = useStoreState(ReservationStore);
  const [successfullyReservedSlots, setSuccessfullyReservedSlots] = useState(
    []
  );
  const [selectedFloor, setSelectedFloor] = useState(
    initialSelectedFloor || null
  );
  const [selectedSlot, setSelectedSlot] = useState(initialSelectedSlot || null);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);
  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        const slotSnapshot = await getDocs(collection(db, "slot", item.managementName, "slotData"));
        const slotData = slotSnapshot.docs.map((doc) => doc.data());
  
        setSlotSets(processSlotData(slotData));
      };
  
      fetchData();
    }, [item.managementName])
  );
  
  useFocusEffect(
    React.useCallback(() => {
      // Set the default floor when the screen is focused
      if (!selectedFloor && slotSets.length > 0) {
        const defaultFloor = slotSets[0].title; // Assumes the first floor in slotSets array
        setSelectedFloor(defaultFloor);
      }
    }, [slotSets])
  );
useEffect(() => {
  const fetchReservations = async () => {
    if (!auth.currentUser?.email) return;

    const q = query(
      collection(db, "reservations"),
      where("userEmail", "==", auth.currentUser.email) // Fetch reservations for the current user
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const reservationData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setreservationInformation(reservationData[0]); // Assuming one reservation per user
      } else {
        setreservationInformation(null); // No reservations found
      }
    });

    return () => unsubscribe();
  };

  fetchReservations();
}, [auth.currentUser?.email]);

  useEffect(() => {
    const reservationsRef = collection(db, "reservations");
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

  const [userInformation, setUserInformation] = useState(null);

  // Real time user
  useEffect(() => {
    const unsubscribe = fetchData(
      {
        collectionName: "user",
        conditions: [["email", "==", auth.currentUser.email]],
      },
      ({ data, error }) => {
        if (error) {
          console.error("Error fetching data:", error);
          setUserInformation(null);
        } else if (data) {
          setUserInformation(data[0]);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  // Real time user

  const [reservationInformation, setreservationInformation] = useState(null);
  const [slotDetails, setSlotDetails] = useState(null);
  useEffect(() => {
    const unsubscribe = fetchReservation(
        {
            collectionName: "reservations",
            conditions: [["userEmail", "==", auth.currentUser.email]],
        },
        ({ data, error }) => {
            if (error) {
                console.error("Error fetching data:", error);
                setreservationInformation(null);
            } else {
                console.log("Fetched reservation data:", data);
                setreservationInformation(data ? data[0] : null);
            }
        }
    );

    return () => unsubscribe();
}, []);

useEffect(() => {
    if (!auth.currentUser || !auth.currentUser.email) {
        console.log("No valid user email available for fetching reservations.");
        return;
    }

    console.log("Fetching reservations for email:", auth.currentUser.email);

    const params = {
        collectionName: "reservations",
        conditions: [["userEmail", "==", auth.currentUser.email]],
    };

    const unsubscribe = fetchReservation(params, ({ data, error }) => {
        if (error) {
            console.error("Error fetching reservation data:", error);
            setreservationInformation(null);
        } else if (data && data.length > 0) {
            console.log("Fetched reservation data:ssss", data);
            setreservationInformation(data[0]);
        } else {
            console.log("No reservations found for the current user.");
            setreservationInformation(null);
        }
    });

    return () => {
        console.log("Unsubscribing from reservation data updates.");
        unsubscribe();
    };
}, [auth.currentUser?.email]); // Dependency on user's email

  useEffect(() => {
    // Set the initial floor and slot selection based on passed parameters
    if (initialSelectedFloor) setSelectedFloor(initialSelectedFloor);
    if (initialSelectedSlot) setSelectedSlot(initialSelectedSlot);
  }, [initialSelectedFloor, initialSelectedSlot]);

  useEffect(() => {
    const saveReservedSlots = async () => {
      try {
        await AsyncStorage.setItem(
          "reservedSlots",
          JSON.stringify(reservedSlots)
        );
      } catch (error) {
        console.error("Error saving reserved slots to AsyncStorage:", error);
      }
    };
    console.log("reservedSlots", reservedSlots);
    saveReservedSlots();
  }, [reservedSlots]);

  const USER_RESERVED_SLOTS_KEY = `reservedSlots_${user.email}`;

  useEffect(() => {
    const loadReservedSlots = async () => {
      try {
        // const storedReservedSlots = await AsyncStorage.getItem(
        //   USER_RESERVED_SLOTS_KEY
        // );
        // if (storedReservedSlots) {
        //   setReservedSlots(JSON.parse(storedReservedSlots));
        // }
      } catch (error) {
        console.error("Error loading reserved slots from AsyncStorage:", error);
      }
    };

    if (user.email) {
      loadReservedSlots();
    }
  }, [user?.email]);

  useEffect(() => {
    const saveReservedSlots = async () => {
      try {
        await AsyncStorage.setItem(
          USER_RESERVED_SLOTS_KEY,
          JSON.stringify(reservedSlots)
        );
      } catch (error) {
        console.error("Error saving reserved slots to AsyncStorage:", error);
      }
    };

    if (user.email) {
      saveReservedSlots();
    }
  }, [reservedSlots, user.email]);

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
    const auth = getAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setEmail(firebaseUser.email);
        setPlateNumber(firebaseUser.carPlateNumber);
      } else {
        console.log("User is not logged in");
      }
    });

    const establishmentQuery = query(
      collection(db, "establishments"),
      where("managementName", "==", item.managementName)
    );
    const unsubscribeSlots = onSnapshot(
      establishmentQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const establishmentData = snapshot.docs[0].data();
          console.log("Establishment data:", establishmentData);
          setSlotSets(processEstablishmentData(establishmentData));
          setFee(establishmentData.parkingPay);
        } else {
          console.log("Establishment data not found");
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching real-time data:", error);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribeSlots();
    };
  }, [item.managementName]);

  useEffect(() => {
    const slotDataRef = collection(db, "slot", item.managementName, "slotData");
  
    const unsubscribe = onSnapshot(slotDataRef, (snapshot) => {
      const updatedSlotData = new Map();
  
      snapshot.forEach((doc) => {
        const { status } = doc.data();
        const [prefix, floor, index] = doc.id.split("_");
        if (prefix === "slot" && floor && index !== undefined) {
          const combinedId = `${floor}-${index}`;
          updatedSlotData.set(combinedId, status);
        }
      });
  
      setSlotSets((currentSlotSets) =>
        currentSlotSets.map((floor) => ({
          ...floor,
          slots: floor.slots.map((slot, index) => {
            const combinedId = `${floor.title}-${index}`;
            return {
              ...slot,
              occupied: updatedSlotData.get(combinedId) === "Occupied",
            };
          }),
        }))
      );
    });
  
    return () => unsubscribe();
  }, [item.managementName]);
  useEffect(() => {
    if (reservedSlots.some((slot) => slot.occupied === false)) {
      setReservedSlots((prev) => prev.filter((slot) => slot.occupied));
    }
  }, [slotSets]);
    

  useEffect(() => {
    const slotDataRef = collection(db, "slot", item.managementName, "slotData");
    const resDataRef = collection(db, "res", item.managementName, "resData");

    let fetchedSlotData = new Map();
    let fetchedResData = new Map();

    const processSlotData = (querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const docName = doc.id;
            const [prefix, floor, index] = docName.split("_");
            if (prefix === "slot" && floor && index !== undefined) {
                const combinedId = `${floor}-${index}`;
                fetchedSlotData.set(combinedId, doc.data().status);
            }
        });
    };

    const processResData = (querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const status = data.status;
            const slotId = data.slotId;
            fetchedResData.set(slotId, status);
        });
    };

    const unsubscribeSlot = onSnapshot(slotDataRef, (querySnapshot) => {
        processSlotData(querySnapshot);
        updateSlotSets();
    });

    const unsubscribeRes = onSnapshot(resDataRef, (querySnapshot) => {
        processResData(querySnapshot);
        updateSlotSets();
    });

    // Update slot sets with real-time data
    const updateSlotSets = () => {
      setSlotSets((currentSlotSets) =>
        currentSlotSets.map((floor) => ({
          ...floor,
          slots: floor.slots.map((slot, index) => {
            const combinedId = `${floor.title}-${index}`;
            const isOccupied =
              fetchedSlotData.get(combinedId) === "Occupied" ||
              fetchedResData.get(slot.slotNumber) === "Occupied";
  
            return {
              ...slot,
              occupied: isOccupied,
            };
          }),
        }))
      );
    };

    return () => {
        unsubscribeSlot();
        unsubscribeRes();
    };
}, [db, item.managementName]);


useEffect(() => {
    const fetchResStatus = async () => {
        if (user?.name) {
            const resStatusQuery = query(
                collection(db, 'resStatus'),
                where('userName', '==', user.name),
                where('managementName', '==', item.managementName)
            );
            const unsubscribeResStatus = onSnapshot(resStatusQuery, (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added' || change.type === 'modified') {
                        const resStatusData = change.doc.data();
                        const message = `Reservation Status for Slot ${resStatusData.slotId + 1} is ${resStatusData.resStatus}`;
                        setReservationStatus(resStatusData.resStatus);
                        setReservationManagement(resStatusData.managementName);

                        if (!alertShown) {
                            Alert.alert('Reservation Status Update', message, [{ text: 'OK', onPress: () => setAlertShown(true) }]);
                        }
                    }
                });
            });

            return () => {
                unsubscribeResStatus();
            };
        }
    };

    fetchResStatus();
}, [user?.name, item.managementName, alertShown]);

const processEstablishmentData = (establishmentData) => {
    let newSlotSets = [];
    let slotCounter = 0;

    if (Array.isArray(establishmentData.floorDetails) && establishmentData.floorDetails.length > 0) {
        establishmentData.floorDetails.forEach((floor) => {
            const floorSlots = Array.from({ length: parseInt(floor.parkingLots) }, (_, i) => ({
                id: `${floor.floorName}-${i + 1}`,
                floor: floor.floorName,
                slotNumber: ++slotCounter,
                occupied: false,
            }));

            newSlotSets.push({
                title: floor.floorName,
                slots: floorSlots,
            });
        });
    } else if (establishmentData.totalSlots) {
        newSlotSets = [{
            title: 'General Parking',
            slots: Array.from({ length: parseInt(establishmentData.totalSlots) }, (_, i) => {
                const slotKey = `slot_General_${i}`;
                const slotData = reservedSlots.find(slot => slot.id === slotKey);
                return {
                    id: i,
                    floor: 'General Parking',
                    slotNumber: ++slotCounter,
                    occupied: !!slotData,
                };
            }),
        }];
    }

    return newSlotSets;
};
  function generateId() {
    const length = 20;
    const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      // Randomly select a character from the characters string
      const char = characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
      // Randomly decide whether to capitalize the character
      const capitalize = Math.random() < 0.5;
      result += capitalize ? char.toUpperCase() : char;
    }
    return result;
  }

  // If slot already exited
  useEffect(() => {
    if (reservationDetails.status === "Active") {
      const q = query(
        collection(db, "slot", item.managementName, "slotData"),
        where("reservationId", "==", reservationDetails.reservationId)
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        if (querySnapshot.empty) {
          // Kamo nay edit unsa ibutang dapat sa reserved slots kung ma exit na ang slot
          setReservedSlots([]);
          setSuccessfullyReservedSlots([]);
          setSelectedSlot(null);
          // ReservationStore.update((s) => {
          //   s.reservationId = "";
          //   s.status = "Inactive";
          //   s.managementName = "";
          //   s.parkingPay = "";
          // });
        }
      });
      return () => unsubscribe();
    }
  }, [reservationDetails.status]);
  console.log(reservationInformation);
  const handleReservation = async () => {
    if (reservationInformation !== null) {
      Alert.alert(
        "Reservation Limitlll",
        "You can only reserve one slot at a time.",
        [{ text: "OK", style: "default" }]
      );
      return;
    }

    if (selectedSlot !== null) {
      Alert.alert(
        `This action is non - refundable!`,
        `Once you press OKAY, you still need to wait for the operator to accept`,
        [
          { text: "No", style: "cancel" },
          {
            text: "Okay",
            onPress: async () => {
              const { status } =
                await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== "granted") {
                alert(
                  "Sorry, we need camera roll permissions to make this work!"
                );
                return;
              }

              //   const result = await ImagePicker.launchImageLibraryAsync({
              //     mediaTypes: ImagePicker.MediaTypeOptions.Images,
              //     allowsEditing: true,
              //     aspect: [4, 3],
              //     quality: 1,
              //   });

              //   if (result.cancelled) {
              //     Alert.alert(
              //       "Image Upload",
              //       "You need to upload an image to proceed with the reservation."
              //     );
              //     return;
              //   }

              //   const uri = result.assets[0].uri;
              //   console.log("Image URI:", uri); // Ensure URI is logged here

              let floorTitle = "General Parking";
              let slotIndex = -1;
              slotSets.forEach((set) => {
                set.slots.forEach((slot, index) => {
                  if (slot.slotNumber === selectedSlot) {
                    floorTitle = set.title;
                    slotIndex = index;
                  }
                });
              });

              try {
                const resId = generateId();
                setReservationId(resId);
                // const imageUrl = await uploadImageToStorage(
                //   uri,
                //   user.email,
                //   selectedSlot
                // );

                const q = query(
                  collection(db, "user"),
                  where("email", "==", auth.currentUser.email)
                );

                const result = await getDocs(q);

                if (!result.empty) {
                  const docRef = result.docs[0].ref;

                  await updateDoc(docRef, {
                    reservationInformation: {
                      reservationId: resId,
                      managementName: item.managementName,
                    },
                  });
                }

                console.log("ahmmm");

                const reservationData = {
                  userEmail: email,
                  carPlateNumber: userInformation?.carPlateNumber ?? "",
                  slotId: slotIndex,
                  managementName: item.managementName,
                  timestamp: new Date(),
                  status: "Approval",
                  reservationId: resId,
                  floorTitle,
                  currentLocation: location,
                  imageUri: "",
                  parkingPay: fee,
                  userName: userInformation?.name,
                  reservationDuration: item.reservationDuration,
                };

                const uniqueDocName = `slot_${floorTitle}_${slotIndex}`;
                const reservationsRef = collection(db, "reservations");
                await setDoc(
                  doc(reservationsRef, uniqueDocName),
                  reservationData,
                  { merge: true }
                );
                setReservedSlots([
                  ...reservedSlots,
                  {
                    slotNumber: selectedSlot,
                    managementName: item.managementName,
                    parkingPay: item.parkingPay,
                  },
                ]);
                setSelectedSlot(null);

                // Notification
                const notificationsRef = collection(db, "notifications");
                const notificationData = {
                  type: "reservation",
                  details: `A new reservation for slot ${selectedSlot} has been made.`,
                  timestamp: new Date(),
                  managementName: item.managementName,
                  userEmail: email,
                  imageUri: "",
                };
                console.log(notificationData);
                console.log("I REACH HERE");
                await addDoc(notificationsRef, notificationData);

                Alert.alert(
                  "Reservation Successful",
                  `Slot ${selectedSlot} at ${item.managementName} reserved successfully!`
                );
                setSuccessfullyReservedSlots([
                  ...successfullyReservedSlots,
                  selectedSlot,
                ]);
                ReservationStore.update((s) => {
                  s.reservationId = resId;
                  s.status = "Pending";
                  s.managementName = item.managementName;
                  s.parkingPay = item.parkingPay;
                  s.floorTitle = floorTitle;
                  s.slotNumber = selectedSlot;
                });
              } catch (error) {
                console.error("Error saving reservation:", error);
                Alert.alert(
                  "Reservation Failed",
                  "Could not complete your reservation. Please try again."
                );
              }

              //   Alert.alert(
              //     "Confirm Reservation",
              //     `Upload this image and confirm reservation for Slot ${selectedSlot}?`,
              //     [
              //       { text: "Cancel", style: "cancel" },
              //       {
              //         text: "OK",
              //         onPress: async () => {},
              //       },
              //     ],
              //     { cancelable: false }
              //   );
            },
          },
        ],
        { cancelable: false }
      );
    } else {
      Alert.alert(
        "Invalid Reservation",
        "Please select a valid slot before reserving.",
        [{ text: "OK", style: "default" }]
      );
    }
  };

  const handleCancelReservation = async () => {
    const reservedSlot = reservedSlots.find(
      (slot) =>
        slot.slotNumber === selectedSlot &&
        slot.managementName === item.managementName
    );

    // Check if the slot is occupied
    const isSlotOccupied = slotSets.some((floor) =>
      floor.slots.some(
        (slot) => slot.slotNumber === selectedSlot && slot.occupied
      )
    );

    if (isSlotOccupied) {
      Alert.alert(
        "Cancellation Not Allowed",
        "This slot is currently occupied and cannot be canceled.",
        [{ text: "OK", style: "default" }]
      );
      return;
    }

    if (reservedSlot) {
      Alert.alert(
        "Cancel Reservation",
        `Are you sure you want to cancel Slot ${selectedSlot} at ${item.managementName}?`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "OK",
            onPress: async () => {
              try {
                const q = query(
                  collection(db, "reservations"),
                  where("managementName", "==", item.managementName),
                  where("userEmail", "==", email)
                );
                const querySnapshot = await getDocs(q);

                querySnapshot.forEach(async (doc) => {
                  console.log("Document found: ", doc.id);
                  await deleteDoc(doc.ref);
                });

                setReservedSlots((prevSlots) =>
                  prevSlots.filter(
                    (slot) =>
                      slot.slotNumber !== selectedSlot ||
                      slot.managementName !== item.managementName
                  )
                );
                setSelectedSlot(null);
                Alert.alert(
                  "Reservation Canceled",
                  `Reservation for Slot ${selectedSlot} at ${item.managementName} canceled successfully!`
                );
                setSuccessfullyReservedSlots((prev) =>
                  prev.filter((slot) => slot !== selectedSlot)
                );
                // setReservationId("");
                // ReservationStore.update((s) => {
                //   s.reservationId = "";
                //   s.status = "Inactive";
                //   s.managementName = "";
                //   s.parkingPay = "";
                // });
              } catch (error) {
                console.error("Error canceling reservation:", error);
                Alert.alert(
                  "Cancellation Failed",
                  "Could not cancel your reservation. Please try again.",
                  [{ text: "OK", style: "default" }]
                );
              }
            },
          },
        ],
        { cancelable: false }
      );
    } else {
      Alert.alert(
        "Invalid Cancellation",
        "Please select a valid reserved slot before canceling.",
        [{ text: "OK", style: "default" }]
      );
    }
  };

  console.log("Setting reservation details:", {
    reservationId: reservationDetails.reservationId,
    status: reservationDetails.status,
    managementName: reservationDetails.managementName,
    parkingPay: reservationDetails.parkingPay,
    floorTitle: reservationDetails.floorTitle, // Log floor title
    slotNumber: reservationDetails.slotNumber, // Log slot number
  });

  const totalAmount = reservedSlots.length * SLOT_PRICE;
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Image
          source={{ uri: "https://i.imgur.com/WwPGlNh.png" }}
          style={styles.backgroundImage}
        />
        <Image
          source={{ uri: "https://i.imgur.com/Tap1nZy.png" }}
          style={[
            styles.backgroundImage,
            {
              borderTopLeftRadius: 80,
              marginTop: 50,
              borderTopRightRadius: 80,
            },
          ]}
        />
        <Image
          source={require("./images/backgroundWhite.png")}
          style={[
            styles.backgroundImage,
            { borderTopLeftRadius: 130, marginTop: 100 },
          ]}
        />
        <View style={styles.container}>
          {isLoading ? (
            <Text>Loading slots...</Text>
          ) : (
            selectedFloor &&
            slotSets
              .filter((set) => set.title === selectedFloor)
              .map((floor, index) => (
                <View key={index} style={styles.floorContainer}>
                  <Text style={styles.floorTitle}>{floor.title}</Text>
                  <View style={styles.slotContainer}>
                    {floor.slots.map((slot) => (
                      <TouchableOpacity
                        key={slot.id}
                        style={[
                          styles.slotButton,
                          slot.occupied && styles.occupiedSlotButton,
                          selectedSlot === slot.slotNumber && [
                            styles.highlightedSlotButton,
                            { transform: [{ scale: pulseAnim }] },
                          ],
                          successfullyReservedSlots.includes(slot.slotNumber) &&
                            styles.successfullyReservedSlotButton,
                        ]}
                        onPress={() => setSelectedSlot(slot.slotNumber)}
                        disabled={slot.occupied}
                      >
                        <Text style={styles.slotButtonText}>
                          {slot.slotNumber}
                        </Text>
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
        </View>
      </ScrollView>
      <View style={styles.cardContainer}>
        <View style={styles.dropdownContainer}>
          <Text style={styles.dropdownLabel}>Select Floor:</Text>
          <RNPickerSelect
            placeholder={{ label: "Select a floor", value: null }}
            items={slotSets.map((set) => ({
              label: set.title,
              value: set.title,
            }))}
            onValueChange={(value) => setSelectedFloor(value)}
            style={{
              inputIOS: {
                fontSize: 16,
                paddingVertical: 12,
                paddingHorizontal: 10,
                borderWidth: 1,
                borderColor: "gray",
                borderRadius: 4,
                color: "black",
                paddingRight: 30,
                backgroundColor: "#fff",
              },
              inputAndroid: {
                fontSize: 16,
                paddingVertical: 8,
                paddingHorizontal: 10,
                borderWidth: 1,
                borderColor: "gray",
                borderRadius: 4,
                color: "black",
                paddingRight: 30,
                backgroundColor: "#fff",
              },
            }}
            value={selectedFloor}
          />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
          <View style={{ flex: 1, margin: 5 }}>
            <Button
              title="Reserve Slot"
              onPress={handleReservation}
              color="#39e75f"
              accessibilityLabel="Reserve your selected parking slot"
            />
          </View>
          <View style={{ flex: 1, margin: 5 }}>
            <Button
              title="Cancel Slot"
              onPress={handleCancelReservation}
              color="red"
              accessibilityLabel="Cancel your reserved parking slot"
            />
          </View>
        </View>
        {reservationInformation ? (
    <View>
      <Text style={styles.infoTextTitle}>Your Reservation</Text>
      <Text style={styles.infoText}>
        Slot {reservationInformation.slotId + 1} at {reservationInformation.managementName}
      </Text>
      <Text style={styles.infoText2}>
        Total Amount: {reservationInformation.parkingPay}.00
      </Text>
    </View>
  ) : slotDetails ? (
    <View>
      <Text style={styles.infoTextTitle}>You are parked at</Text>
      <Text style={styles.infoText}>
        Slot {slotDetails.slotId + 1} on {slotDetails.floorTitle}
      </Text>
    </View>
  ) : (
    <Text style={styles.infoText}>Loading data...</Text>
  )}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  reserveSlotButtonText: {
    borderRadius: 100,
    width: 10,
  },
  floorLable: {
    marginTop: "-5%",
    fontSize: 35,
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: "#FFD700",
    marginTop: 16,
    marginBottom: 16,
    padding: 1,
  },
  vacantSlotButton: {
    backgroundColor: "#3498db",
  },
  occupiedSlotButton: {
    backgroundColor: "red",
  },
  clickedSlotButton: {
    backgroundColor: "#27ae60",
  },
  reservedSlotButton: {
    backgroundColor: "white",
  },

  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  zoneTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  floorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    marginTop: 50,
  },
  slotContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: "15%",
    marginBottom: 100,
  },
  slotButton: {
    backgroundColor: "green",
    padding: 20,
    margin: 10,
    borderRadius: 10,
    width: 80,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },

  slotButtonText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },
  reserveButton: {
    backgroundColor: "#2ecc71",
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },
  totalAmountText: {
    fontSize: 16,
    marginTop: "-40%",
  },
  reservedSlotsText: {
    fontSize: 16,
    marginTop: 20,
  },
  highlightedSlotButton: {
    borderWidth: 3,
    borderColor: "orange",
    shadowColor: "orange",
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },

  successfullyReservedSlotButton: {
    borderWidth: 3,
    borderColor: "#FFD700", // Add this style for successfully reserved slots
  },
  dropdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    paddingHorizontal: 10,
  },
  dropdownLabel: {
    marginRight: 10,
    fontSize: 16,
    fontWeight: "bold",
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
  },
  floorButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#3498db",
    borderRadius: 5,
    marginHorizontal: 5,
  },
  selectedFloorButton: {
    backgroundColor: "#2ecc71",
  },
  floorButtonText: {
    color: "white",
    fontSize: 16,
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },

  cardContainer: {
    borderTopRightRadius: 40,
    borderTopLeftRadius: 40,
    backgroundColor: "#ffffff",
    borderWidth: 3,
    borderColor: "#FFD700",
    borderBottomWidth: 0,
    padding: 20,
    paddingTop: 25,
    marginTop: "-20%",
    height: "40%",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  infoContainer: {
    padding: 20,
    backgroundColor: "#fff",
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    width: "100%",
    position: "absolute",
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 30,
    marginLeft: 20,
  },

  infoTextTitle: {
    fontSize: 18,
    color: "#333",
    fontFamily: "Copperplate",
    textAlign: "left",
    marginTop: 15,
  },

  infoText: {
    fontSize: 16,
    color: "#333",
    fontFamily: "Arial",
    marginTop: 5,
  },

  infoText2: {
    fontSize: 16,
    color: "#FFAE42",
    fontFamily: "Arial",
  },
  divider: {
    width: "90%",
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 8,
  },
});
