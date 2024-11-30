import React, { useState, useRef, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  FlatList,
  Alert,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import UserContext from "./UserContext";
import { LocationStore, ReservationStore } from "./store";
import { useStoreState } from "pullstate";
import * as Location from "expo-location";
import {
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  updateDoc,
  firestore,
} from "firebase/firestore";
import { db } from "./config/firebase";
import { unregisterIndieDevice } from "native-notify";
import { auth } from "./config/firebase"; // Make sure you import auth from firebase
import { useMapLogic } from "./utilities/useMapLogic";
import { getUnreadIndieNotificationInboxCount } from "native-notify";
import { fetchUnreadCount } from "./Notification";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

export default function Dashboard() {
  const [selectedLocation, setUnreadNotifications] = useState(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const { recommendedPlaces } = useMapLogic();
  const navigation = useNavigation();
  const { user } = useContext(UserContext);
  const goToProfile = () => {
    navigation.navigate("Profiles", { user });
  };

  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const [recommended, setRecommended] = useState([]);
  const [reservationConfirmed, setReservationConfirmed] = useState(false); // Track reservation status
  const reservationDetails = useStoreState(ReservationStore);
  const [isActive, setIsActive] = useState(
    reservationDetails?.status !== "Paid" ? true : false
  );

  console.log("Bruh");
  console.log(reservationDetails);

  const [reservationInformation, setreservationInformation] = useState(null);

  useEffect(() => {
    const unsubscribe = fetchData();

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs only once

  const fetchData = () => {
    console.log("Listening for real-time data...");
  
    const q = query(
      collection(db, "reservations"),
      where("userEmail", "==", user.email)
    );
  
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (querySnapshot.empty) {
        console.log("No reservations found for this user.");
        setreservationInformation(null); // Clear reservation info when no document exists
        return;
      }
  
      // Handle the case for a single reservation document
      const reservation = querySnapshot.docs[0].data();
      setreservationInformation(reservation);
      console.log("Real-time reservation data:", reservation);
    }, 
    (error) => {
      console.error("Error fetching real-time data:", error);
    });
  
    return unsubscribe;
  };
  

  console.log("worht fighting");
  console.log(reservationInformation);

  useEffect(() => {
    const fetchRecommended = async () => {
      // Assume 'establishments' collection stores 'managementName' which we need to fetch
      const establishmentsSnapshot = await getDocs(
        collection(db, "establishments")
      );
      const establishments = establishmentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch establishments again but now filtered by each unique managementName
      const promises = establishments.map((establishment) => {
        const q = query(
          collection(db, "establishments"),
          where("managementName", "==", establishment.managementName)
        );
        return getDocs(q);
      });

      const snapshots = await Promise.all(promises);
      const recommendations = snapshots.flatMap((snap) =>
        snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          profileImageUrl: doc.data().profileImageUrl,
          managementName: doc.data().managementName,
        }))
      );

      setRecommended(recommendations);
    };

    fetchRecommended();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadNotifications();
    }, 1000); // Poll every minute

    return () => clearInterval(interval);
  }, [user?.email]);

  const fetchUnreadNotifications = async () => {
    if (user?.email) {
      try {
        const count = await getUnreadIndieNotificationInboxCount(
          user.email,
          24190,
          "7xmUkgEHBQtdSvSHDbZ9zd"
        );
        setUnreadNotificationCount(count);
      } catch (error) {
        console.error("Error fetching unread notification count:", error);
      }
    }
  };

  // Call initially and on email change
  useEffect(() => {
    fetchUnreadNotifications();
  }, [user?.email]);
  const emptyStorage = async () => {
    try {
      await AsyncStorage.setItem("reservedSlots", JSON.stringify([]));
    } catch (error) {
      console.error("Error saving reserved slots to AsyncStorage:", error);
    }
  };
  useFocusEffect(
    React.useCallback(() => {
      setIsActive(reservationDetails?.status === "Inactive" ? false : true);
      if (reservationDetails.reservationId !== "") {
        const q = query(
          collection(db, "resStatus"),
          where("reservationId", "==", reservationDetails.reservationId)
        );
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          if (!querySnapshot.empty) {
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              if (data.resStatus === "Declined") {
                Alert.alert(
                  "Declined",
                  "Your reservation request has been declined.",
                  [{ text: "OK", style: "default" }]
                );
                emptyStorage();
                setIsActive(false);
                ReservationStore.update((s) => {
                  s.reservationId = "";
                  s.status = "Inactive";
                  s.managementName = "";
                  s.parkingPay = "";
                });
              } else if (data.resStatus === "Accepted") {
                setIsActive(true);
                ReservationStore.update((s) => {
                  s.status = "Active";
                });
              }
            });
          }
        });
        return () => unsubscribe();
      }
    }, [reservationDetails.reservationId])
  );
  useFocusEffect(
    React.useCallback(() => {
      if (reservationDetails.status === "Active") {
        const q = query(
          collection(db, "slot", reservationDetails.managementName, "slotData"),
          where("reservationId", "==", reservationDetails.reservationId)
        );
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          if (querySnapshot.empty) {
            emptyStorage();
            setIsActive(false);

            ReservationStore.update((s) => {
              s.reservationId = "";
              s.status = "Inactive";
              s.managementName = "";
              s.parkingPay = "";
            });
          }
        });
        return () => unsubscribe();
      }
    }, [reservationDetails.status])
  );
  useEffect(() => {
    const getCurrentLoc = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Please grant location permissions");
        return;
      }
      let currentLocation;
      while (!currentLocation) {
        currentLocation = await Location.getCurrentPositionAsync({});
        if (!currentLocation) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
      if (currentLocation) {
        updateLoc(currentLocation);
      }
    };
    const updateLoc = async (location) => {
      if (location) {
        LocationStore.update((store) => {
          store.lat = location.coords.latitude;
          store.lng = location.coords.longitude;
        });
      } else {
        console.log("Location update failed!");
      }
    };
    getCurrentLoc();
  }, []);

  useEffect(() => {
    if (reservationConfirmed) {
      setIsActive(true);
    }
  }, [reservationConfirmed]);

  const handleCarouselCard = (item) => {
    console.log("Selected item:", item); // Debug log to see what's being passed

    if (!item || !item.managementName) {
      console.error("No valid establishment or management name found:", item);
      return; // Prevent further execution if item is not valid
    }

    navigation.navigate("Details", { item: item });
  };

  const handleCardClick = (screenName) => {
    setSidebarVisible(false);
    if (screenName === "Start") {
      handleLogout();
    } else {
      navigation.navigate(screenName);
    }
  };

  const handleBarsClick = () => {
    setSidebarVisible(!isSidebarVisible);
  };

  const flatListRef = useRef(null);
  const scrollInterval = useRef(null);

  useEffect(() => {
    scrollInterval.current = setInterval(() => {
      if (flatListRef.current && recommendedPlaces.length > 0) {
        currentIndex = (currentIndex + 1) % recommendedPlaces.length; // Update the index
        flatListRef.current.scrollToIndex({
          index: currentIndex,
          animated: true,
        });
      }
    }, 5000);

    return () => clearInterval(scrollInterval.current);
  }, [recommendedPlaces.length]);

  const handleViewRecentParked = () => {
    navigation.navigate("Map");
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      currentIndex = viewableItems[0].index;
    }
  }).current;

  let currentIndex = 0;

  useEffect(() => {
    const getCurrentLoc = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Please grant location permissions");
        return;
      }

      let currentLocation;

      while (!currentLocation) {
        currentLocation = await Location.getCurrentPositionAsync({});
        if (!currentLocation) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      if (currentLocation) {
        updateLoc(currentLocation);
      }
    };

    const updateLoc = async (location) => {
      if (location) {
        LocationStore.update((store) => {
          store.lat = location.coords.latitude;
          store.lng = location.coords.longitude;
        });
      } else {
        console.log("Location update failed!");
      }
    };

    getCurrentLoc();
  }, []);

  const renderCarouselItem = ({ managementName, item }) => {
    return (
      <TouchableOpacity onPress={() => handleCarouselCard(item)}>
        <View style={styles.carouselItemContainer}>
          <Image
            source={
              item.profileImageUrl
                ? { uri: item.profileImageUrl }
                : require("./images/SPOTWISE.png")
            }
            style={styles.carouselImage}
          />
          <Text style={styles.carouselText}>{item.managementName}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    console.log("Recommended places awsad:", recommendedPlaces);
  }, [recommendedPlaces]);
  const renderParkedHistoryItem = ({ item }) => {
    return (
      <View style={styles.historyItemContainer}>
        <Image source={item} style={styles.historyItemImage} />
      </View>
    );
  };

  const renderParkedItem = ({ item }) => {
    return (
      <View style={styles.parkedItemContainer}>
        <Image source={item} style={styles.parkedItemImage} />
      </View>
    );
  };

  const handleReservationStatusClick = () => {
    if (isActive && reservationDetails) {
      navigation.navigate("reservation", {
        item: reservationDetails,
        selectedFloor: reservationDetails.floorTitle, // Pass the floor title
        selectedSlot: reservationDetails.slotNumber, // Pass the slot number
      });
    } else {
      Alert.alert("Navigation Error", "No active reservation to navigate.");
    }
  };
  

  useEffect(() => {
    if (user) {
      console.log("Current User:", user);
    } else {
      console.log("No user is logged in");
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      if (!auth.currentUser) {
        console.error("No user currently logged in to logout");
        alert("No user is logged in");
        return;
      }

      // Ensure we have the user's email or a valid identifier for unregistration
      const userEmail = auth.currentUser.email;
      if (!userEmail) {
        console.error("No email found for the current user");
        alert("Failed to retrieve user email for logout");
        return;
      }

      // Call Native Notify to unregister the device
      await unregisterIndieDevice(userEmail, 24190, "7xmUkgEHBQtdSvSHDbZ9zd");
      console.log("Indie ID unregistration successful for email:", userEmail);

      // Proceed with Firebase sign-out or other cleanup actions
      await auth.signOut();
      console.log("Firebase sign-out successful for UID:", userEmail);

      // Redirect or update UI post-logout
      navigation.navigate("Login"); // Uncomment or modify based on your routing needs
    } catch (error) {
      console.error("Error during logout:", error.message);
      alert("Logout failed: " + error.message);
    }
  };

  const unregisterIndieSubs = async () => {
    setIsLoading(true); // Starts loading
    try {
      const response = await fetch("https://api.example.com/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${"6W2xCaWiR8rBZ7xmUkgEHBQtdSvSHDbZ9zdCBR7UUCkv"}`, // Add backticks for template literal
        },
        body: JSON.stringify({ userId: user.email, appId: 24190 }), // Proper JSON format
      });

      if (!response.ok) {
        throw new Error("Failed to unsubscribe.");
      }

      const data = await response.json();
      console.log("Unregistered Indie Subs for user ID:", user.email);
      Alert.alert("Success", "You have been successfully unsubscribed.");
    } catch (error) {
      console.error("Error during Indie Subs unregistration:", error);
      Alert.alert("Error", "Unsubscription failed.");
    } finally {
      setIsLoading(false); // Stops loading after completion
    }
  };

  const uploadImageToStorage = async (localUri, userEmail, slotId) => {
    const fileName = `image_${slotId}}`; // Name file based on slotId and timestamp
    const storage = getStorage();
    const fileRef = storageRef(storage, `images/${userEmail}/${fileName}`);
    const response = await fetch(localUri);
    const blob = await response.blob();

    console.log();
    try {
      await uploadBytes(fileRef, blob);
      const downloadURL = await getDownloadURL(fileRef);
      console.log("Image uploaded and URL received:", downloadURL);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image to Firebase Storage:", error);
      throw new Error("Failed to upload image.");
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: "https://i.imgur.com/Y6azwpB.png" }}
        style={styles.backgroundImage}
      />

      <View style={styles.container}>
        <Image style={styles.navbar} />
        <View style={styles.logoContainer}>
        <Text style={styles.logoText}>Recommended nearby parking spaces</Text>
    <Text style={styles.logoSubText}>Secure your spots now!</Text>
  </View>
  <View style={styles.container}>
    <View>
      <FlatList
        ref={flatListRef}
        data={recommendedPlaces}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderCarouselItem}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
      />
    </View>
    <View style={styles.separatorLine} />
    <View style={{ maxWidth: 400, marginBottom: 20 }}>
      <View>
      {!reservationInformation?.status || reservationInformation?.status === "Inactive" ? (

        <View style={{ justifyContent: "center", alignItems: "center" }}>
          <View style={styles.additionalCard}>
            <Text style={styles.additionalCardTitle}>
              Explore more parking places
            </Text>
            <Text style={styles.additionalCardContent}>
              More parking areas are available here!
            </Text>
            <TouchableOpacity
              style={styles.additionalButton}
              onPress={() => navigation.navigate("Map")}
            >
              <Text style={styles.additionalButtonText}>Explore</Text>
            </TouchableOpacity>
          </View>
        </View>
  ) : null}

        <TouchableOpacity
          style={[
            styles.reservationStatusContainer,
            isActive ? styles.active : styles.inactive,
          ]}
          onPress={handleReservationStatusClick}
        >
          <Text style={styles.reservationStatusText}>
            Reservation Status: {reservationInformation?.status || "Inactive"}
          </Text>
        </TouchableOpacity>

        {reservationInformation?.status === "Accepted" && (
          <TouchableOpacity
            style={[
              styles.reservationStatusContainer,
              isActive ? styles.active : styles.inactive,
            ]}
            onPress={async () => {
              const imagePicker = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
              });

              if (imagePicker.cancelled) {
                Alert.alert(
                  "Image Upload",
                  "You need to upload an image to proceed with the reservation."
                );
                return;
              }

              const uri = imagePicker.assets[0].uri;
              const imageUrl = await uploadImageToStorage(
                uri,
                user.email,
                Math.random()
              );
              if (imageUrl) {
                const q = query(
                  collection(db, "reservations"),
                  where("userEmail", "==", user.email)
                );
                const result = await getDocs(q);
                if (!result.empty) {
                  const docRef = result.docs[0].ref;
                  await updateDoc(docRef, {
                    status: "Paid",
                    imageUri: imageUrl,
                  });
                }
              }
            }}
          >
            <Text style={styles.reservationStatusText}>Upload Photo</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  </View>
</View>
        <View style={styles.tabBarContainer}>
          <View style={[styles.tabBar, { opacity: 0.8 }]}>
            <TouchableOpacity style={styles.tabBarButton} onPress={goToProfile}>
              <AntDesign name="user" size={24} color="#A08C5B" />
              <Text style={styles.tabBarText}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabBarButton}
              onPress={() => handleCardClick("Search")}
            >
              <AntDesign name="earth" size={24} color="#A08C5B" />
              <Text style={styles.tabBarText}>Search</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabBarButton}
              onPress={() => navigation.navigate("Notifications", { user })}
            >
              <View style={{ position: "relative" }}>
                <AntDesign name="bells" size={24} color="#A08C5B" />
                {unreadNotificationCount > 0 && (
                  <View style={styles.notificationBubble}>
                    <Text style={styles.notificationCount}>
                      {unreadNotificationCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.tabBarText}>Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabBarButton}
              onPress={handleBarsClick}
            >
              <AntDesign name="bars" size={24} color="#A08C5B" />
              <Text style={styles.tabBarText}>Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Modal
          animationType="fade"
          transparent={true}
          visible={isSidebarVisible}
        >
          <TouchableWithoutFeedback onPress={() => setSidebarVisible(false)}>
            <View style={styles.modalBackground}>
              <TouchableWithoutFeedback>
                <View style={styles.sidebar}>
                  <TouchableOpacity
                    style={styles.sidebarButton}
                    onPress={() => handleCardClick("Feedback")}
                  >
                    <Image
                      source={{ uri: "https://i.imgur.com/c4io4vB.jpeg" }}
                      style={styles.sidebarIcon}
                    />
                    <Text style={styles.sidebarButtonText}>Feedback</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sidebarButton}
                    onPress={() => handleCardClick("Transaction")}
                  >
                    <Image
                      source={{ uri: "https://i.imgur.com/MeRPAqt.png" }}
                      style={styles.sidebarIcon}
                    />
                    <Text style={styles.sidebarButtonText}>Transaction</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sidebarButton}
                    onPress={() => handleCardClick("Park")}
                  >
                    <Image
                      source={{ uri: "https://i.imgur.com/vetauvM.png" }}
                      style={styles.sidebarIcon}
                    />
                    <Text style={styles.sidebarButtonText}>Parking</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sidebarButton}
                    onPress={() => handleLogout("Start")}
                  >
                    <Image
                      source={{ uri: "https://i.imgur.com/YzzzEXD.png" }}
                      style={styles.sidebarIcon}
                    />
                    <Text style={styles.sidebarButtonText}>Log Out</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardContainer: {
    marginHorizontal: 10,
    marginTop: 20,
    borderRadius: 10,
    overflow: "hidden",
    elevation: 5,
    backgroundColor: "white",
  },
  formContainer: {
    padding: 40,
    marginTop: "20%",
    fontFamily: "Courier New",
  },
  navbar: {
    width: "100%",
    height: "7%",
    resizeMode: "contain",
    marginBottom: 15,
    marginTop: 40,
  },
  logoContainer: {
    marginLeft: 25,
  },
  logoText: {
    fontSize: 18,
    color: "#fef250",
    fontWeight: "bold",
    marginBottom: 30,
  },
  logoSubText: {
    fontSize: 12,
    color: "#f5f5f5",
    marginTop: -30,
    marginBottom: 10,
    fontWeight: "bold",
    marginLeft: 85,
  },
  carouselContainer: {
    height: 250, // Increase height to make it more prominent
    marginVertical: 20, // Add vertical margin to create space around the FlatList
  },
  separatorLine: {
    marginTop: 30,
    width: "90%",
    height: 1,
    backgroundColor: "#e0e0e0", // Light gray line to divide sections
    alignSelf: "center",
    marginVertical: 15,
  },
  carouselItemContainer: {
    width: 340,
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
    marginHorizontal: 10,
    elevation: 5,
    borderWidth: 5,
    borderColor: "#dec049",
    position: "relative",
    backgroundColor: "black",
  },
  carouselImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    opacity: 0.9,
  },
  carouselText: {
    position: "absolute",
    bottom: 5,
    left: 10,
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 8,
    borderRadius: 10,
  },
  tabBarContainer: {
    marginTop: "60%",
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    paddingVertical: 10,
    elevation: 3,
  },
  tabBarButton: {
    alignItems: "center",
  },
  tabBarText: {
    color: "#A08C5B",
    marginTop: 5,
  },
  sidebarContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sidebar: {
    width: "80%",
    backgroundColor: "white",
    padding: 25,
    borderRadius: 10,
  },
  sidebarButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  sidebarIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
    marginRight: 10,
  },
  sidebarButtonText: {
    fontSize: 16,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Dark background overlay
    justifyContent: "center",
    alignItems: "flex-start",
  },

  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  parkedHistoryContainer: {
    overflow: "hidden",
    marginHorizontal: 10,
    position: "relative",
    marginTop: 20,
  },
  historyItemImage: {
    width: 150,
    height: 100,
    resizeMode: "cover",
    borderRadius: 10,
  },
  card: {
    width: "90%",
    maxWidth: 400,
    height: "230%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    backgroundColor: "white",
    opacity: 0.8,
    padding: "6%",
    borderRadius: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#888",
  },
  button: {
    marginTop: 13.4,
    backgroundColor: "#FFD700",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
  },
  additionalCard: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#f0f0f0", // Lighter background to make it blend more
    borderRadius: 8, // Smaller border radius for a subtler look
    padding: 12, // Reduced padding
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5, // Lower shadow opacity to make it less prominent
    shadowRadius: 3,
    elevation: 2, // Lower elevation
    marginTop: 10,
  },
  additionalCardTitle: {
    fontSize: 16, // Slightly smaller font size
    fontWeight: "500", // Make font weight regular
    marginBottom: 5,
    color: "#333", // Darker, muted color
  },
  additionalCardContent: {
    fontSize: 14, // Smaller font size
    color: "#666", // Muted text color
    marginBottom: 15,
  },
  additionalButton: {
    backgroundColor: "#44a6c6", // Subtle button color
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
    alignItems: "center",
  },

  additionalButtonText: {
    color: "#555", // Subtle text color
    fontSize: 14,
  },
  reservationStatusContainer: {
    padding: 10,
    borderRadius: 20,
    marginBottom: 50,
    alignSelf: "center",
    width: "90%",
    borderWidth: 1,
    borderColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  reservationStatusText: {
    fontSize: 16,
  },
  active: {
    backgroundColor: "#39e75f",
  },
  inactive: {
    backgroundColor: "gray",
  },
  notificationBubble: {
    position: "absolute",
    right: -6, // Adjust based on your UI needs
    top: -3, // Adjust based on your UI needs
    backgroundColor: "red",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  notificationCount: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});
