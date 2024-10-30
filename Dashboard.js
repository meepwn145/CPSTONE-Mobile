import React, { useState, useRef, useEffect, useContext } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, TouchableWithoutFeedback, FlatList } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import UserContext from "./UserContext";
import { LocationStore } from "./store";
import * as Location from "expo-location";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./config/firebase";
import {unregisterIndieDevice} from 'native-notify';
import { auth } from './config/firebase'; // Make sure you import auth from firebase
import { useMapLogic } from "./utilities/useMapLogic";
import { getUnreadIndieNotificationInboxCount } from 'native-notify';
import { fetchUnreadCount } from "./Notification";  

export default function Dashboard() {
    const navigation = useNavigation();
    const [selectedLocation, setUnreadNotifications] = useState(null);
    const { user } = useContext(UserContext);
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
    const { recommendedPlaces } = useMapLogic();
    const goToProfile = () => {
        navigation.navigate("Profiles", { user });
    };

    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const [recommended, setRecommended] = useState([]);
    const [isActive, setIsActive] = useState(false);
    const [reservationConfirmed, setReservationConfirmed] = useState(false); // Track reservation status

    

    useEffect(() => {
        const fetchRecommended = async () => {
            // Assume 'establishments' collection stores 'managementName' which we need to fetch
            const establishmentsSnapshot = await getDocs(collection(db, "establishments"));
            const establishments = establishmentsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
    
            // Fetch establishments again but now filtered by each unique managementName
            const promises = establishments.map(establishment => {
                const q = query(collection(db, "establishments"), where("managementName", "==", establishment.managementName));
                return getDocs(q);
            });
    
            const snapshots = await Promise.all(promises);
            const recommendations = snapshots.flatMap(snap => snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                profileImageUrl: doc.data().profileImageUrl,
                managementName: doc.data().managementName
            })));
    
            setRecommended(recommendations);
        };
    
        fetchRecommended();
    }, []);
    
    useEffect(() => {
        const interval = setInterval(() => {
            fetchUnreadNotifications();
        }, 1000);  // Poll every minute

        return () => clearInterval(interval);
    }, [user?.email]);

    const fetchUnreadNotifications = async () => {
        if (user?.email) {
            try {
                const count = await getUnreadIndieNotificationInboxCount(user.email, 24190, '7xmUkgEHBQtdSvSHDbZ9zd');
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


    useEffect(() => {
        if (reservationConfirmed) {
            setIsActive(true);
        }
    }, [reservationConfirmed]);

    const handleCarouselCard = (item) => {
        console.log("Selected item:", item);  // Debug log to see what's being passed
    
        if (!item || !item.managementName) {
            console.error("No valid establishment or management name found:", item);
            return;  // Prevent further execution if item is not valid
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
                <Image  source={item.profileImageUrl ? { uri: item.profileImageUrl } : require("./images/SPOTWISE.png")} style={styles.carouselImage} />
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
        if (isActive) {
            navigation.navigate("Map");
        }
    };
    useEffect(() => {
        if (user) {
            console.log('Current User:', user);
        } else {
            console.log('No user is logged in');
        }
    }, [user]);
    
    const handleLogout = async () => { 
        try {
            if (!auth.currentUser) {
                console.error('No user currently logged in to logout');
                alert('No user is logged in');
                return;
            }
    
            // Ensure we have the user's email or a valid identifier for unregistration
            const userEmail = auth.currentUser.email;
            if (!userEmail) {
                console.error('No email found for the current user');
                alert('Failed to retrieve user email for logout');
                return;
            }
    
            // Call Native Notify to unregister the device
            await unregisterIndieDevice(userEmail, 24190, '7xmUkgEHBQtdSvSHDbZ9zd');
            console.log('Indie ID unregistration successful for email:', userEmail);
    
            // Proceed with Firebase sign-out or other cleanup actions
            await auth.signOut();
            console.log('Firebase sign-out successful for UID:', userEmail);
    
            // Redirect or update UI post-logout
            navigation.navigate('Login'); // Uncomment or modify based on your routing needs
        } catch (error) {
            console.error('Error during logout:', error.message);
            alert('Logout failed: ' + error.message);
        }
    };
    
    const unregisterIndieSubs = async () => {
        setIsLoading(true); // Starts loading
        try {
            const response = await fetch('https://api.example.com/unsubscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${'6W2xCaWiR8rBZ7xmUkgEHBQtdSvSHDbZ9zdCBR7UUCkv'}`, // Add backticks for template literal
                },
                body: JSON.stringify({ userId: user.email, appId: 24190 }) // Proper JSON format
            });
    
            if (!response.ok) {
                throw new Error('Failed to unsubscribe.');
            }
    
            const data = await response.json();
            console.log('Unregistered Indie Subs for user ID:', user.email);
            Alert.alert("Success", "You have been successfully unsubscribed.");
        } catch (error) {
            console.error('Error during Indie Subs unregistration:', error);
            Alert.alert("Error", "Unsubscription failed.");
        } finally {
            setIsLoading(false); // Stops loading after completion
        }
    };
    

    return (
        <View style={styles.container}>
            <Image source={{ uri: 'https://i.imgur.com/Y6azwpB.png' }} style={styles.backgroundImage} />

            <View style={styles.container}>
                <Image style={styles.navbar} />
                <View style={styles.logoContainer}>
                    <Text style={styles.logoText}>Explore more available Parking Lots</Text>
                    <Text style={styles.logoSubText}>Find and Reserve Parking Spaces</Text>
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
                    
                    <View style={{ maxWidth: 400, marginBottom: 20 }}>
                        <View >
                        <View style={{ justifyContent: 'center', alignItems: 'center'}}>
                            <View style={styles.additionalCard}>
                                <Text style={styles.additionalCardTitle}>Explore</Text>
                                <Text style={styles.additionalCardContent}>More parking areas are available here!!</Text>
                                <TouchableOpacity style={styles.additionalButton} onPress={() => navigation.navigate("Map")}>
                                <Text style={styles.additionalButtonText}>Explore</Text>
                                </TouchableOpacity>
                            </View>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.reservationStatusContainer, isActive ? styles.active : styles.inactive]}
                        onPress={handleReservationStatusClick}
                        disabled={!isActive}
                    >
                        <Text style={styles.reservationStatusText}>
                            Reservation Status: {isActive ? "Active" : "Inactive"}
                        </Text>
                    </TouchableOpacity>
                </View>
           
                <View style={styles.tabBarContainer}>
                    <View style={[styles.tabBar, { opacity: 0.8 }]}>
                        <TouchableOpacity style={styles.tabBarButton} onPress={goToProfile}>
                            <AntDesign name="user" size={24} color="#A08C5B" />
                            <Text style={styles.tabBarText}>Profile</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.tabBarButton} onPress={() => handleCardClick("Search")}>
                            <AntDesign name="earth" size={24} color="#A08C5B" />
                            <Text style={styles.tabBarText}>Search</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.tabBarButton} onPress={() => navigation.navigate("Notifications", {user})}>
    <View style={{ position: 'relative' }}>
        <AntDesign name="bells" size={24} color="#A08C5B" />
        {unreadNotificationCount > 0 && (
            <View style={styles.notificationBubble}>
                <Text style={styles.notificationCount}>{unreadNotificationCount}</Text>
            </View>
        )}
    </View>
    <Text style={styles.tabBarText}>Notifications</Text>
</TouchableOpacity>



                        <TouchableOpacity style={styles.tabBarButton} onPress={handleBarsClick}>
                            <AntDesign name="bars" size={24} color="#A08C5B" />
                            <Text style={styles.tabBarText}>Menu</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Modal animationType="fade" transparent={true} visible={isSidebarVisible}>
                    <View style={styles.sidebarContainer}>
                        <TouchableWithoutFeedback onPress={handleBarsClick}>
                            <View style={styles.sidebar}>
                                <TouchableOpacity style={styles.sidebarButton} onPress={() => handleCardClick("Feedback")}>
                                    <Image source={{ uri: 'https://i.imgur.com/c4io4vB.jpeg' }} style={styles.sidebarIcon} />
                                    <Text style={styles.sidebarButtonText}>Feedback</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.sidebarButton} onPress={() => handleCardClick("Transaction")}>
                                    <Image source={{ uri: 'https://i.imgur.com/MeRPAqt.png' }} style={styles.sidebarIcon} />
                                    <Text style={styles.sidebarButtonText}>Transaction</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.sidebarButton} onPress={() => handleCardClick("Park")}>
                                    <Image source={{ uri: 'https://i.imgur.com/vetauvM.png' }} style={styles.sidebarIcon} />
                                    <Text style={styles.sidebarButtonText}>Parking</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.sidebarButton} onPress={() => handleLogout("Start")}>
                                    <Image source={{ uri: 'https://i.imgur.com/YzzzEXD.png' }} style={styles.sidebarIcon} />
                                    <Text style={styles.sidebarButtonText}>Log Out</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </Modal>
            </View>
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
        alignItems: "center",
    },
    logoText: {
        fontSize: 30,
        fontWeight: "bold",
        color: "white",
        marginBottom: 50,
    },
    logoSubText: {
        fontSize: 12,
        color: "#f5f5f5",
        marginTop: -30,
        marginBottom: 10,
        fontWeight: "bold",
    },
    carouselContainer: {
        height: 200,
    },
    carouselItemContainer: {
        width: 360,
        height: 200,
        borderRadius: 20,
        overflow: "hidden",
        marginHorizontal: 10,
        elevation: 5,
        borderWidth: 2,
        borderColor: "#FFD700",
        position: "relative",
        backgroundColor: "white",
    },
    carouselImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    carouselText: {
        position: "absolute",
        bottom: 10,
        left: 10,
        color: "white",
        fontSize: 20,
        fontWeight: "bold",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        padding: 5,
        zIndex: 1,
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
        width: '90%',
        maxWidth: 400,
        height: '230%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
        justifyContent: 'center',
        alignItems: 'center',
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
        alignItems: 'center',
    },
    buttonText: {
        color: "white",
        textAlign: "center",
    },
    additionalCard: {
        width: '90%',
        maxWidth: 400,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
        marginTop: 10,
    },
    additionalCardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    additionalCardContent: {
        fontSize: 16,
        marginBottom: 20,
    },
    additionalButton: {
        backgroundColor: '#007BFF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        alignItems: 'center',
    },
    additionalButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    reservationStatusContainer: {
        padding: 10,
        borderRadius: 20,
        marginBottom: 50,
        alignSelf: 'center',
        width: '90%',
        borderWidth: 1,
        borderColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
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
        position: 'absolute',
        right: -6, // Adjust based on your UI needs
        top: -3, // Adjust based on your UI needs
        backgroundColor: 'red',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    notificationCount: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
});
