import React, { useState, useEffect, useRef} from "react";
import { View, Text, TextInput, SafeAreaView, StyleSheet, Dimensions } from "react-native";
import MapView, { Marker, AnimatedRegion, PROVIDER_GOOGLE } from "react-native-maps"; 
import { Button } from "react-native-elements";
import Constants from "expo-constants";
import { useStoreState } from "pullstate";
import { LocationStore } from "./store";
import { collection, getDocs, query, orderBy, startAt, endAt } from "firebase/firestore";
import { db } from "./config/firebase";
import MapViewDirections from "react-native-maps-directions";
import * as geofire from "geofire-common";
import * as Location from "expo-location";
import { useNavigation, useRoute } from "@react-navigation/native";

const screen = Dimensions.get("window");
const ASPECT_RATIO = screen.width / screen.height;
const LATITUDE_DELTA = 0.03;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
const API_KEY = "AIzaSyAlWELpYZIW3WfRx4JI7kQl5r6ejwcxS1Y";

const Map = ({ route }) => {
    const item = route?.params?.from || null;
    const [map, setMap] = useState(null);
    const [autocomplete, setAutocomplete] = useState(null);
    const navigation = useNavigation();
    const [recentSearches, setRecentSearches] = useState([]);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [recommendedPlaces, setRecommendedPlaces] = useState([]);
    // const [destination, setDestination] = useState({});
    const [selectedPlaceName, setSelectedPlaceName] = useState("");
    const [showDirections, setShowDirections] = useState(false);
    const location = useStoreState(LocationStore);
    const [selectedParkingPay, setSelectedParkingPay] = useState("");
    const [availableSlots, setAvailableSlots] = useState("");
    const initialDestination = route?.params?.destination || null;
    const [state, setState] = useState({
        current: {
            latitude: location.lat,
            longitude: location.lng,
        },
        destination: {},
        coordinate: new AnimatedRegion({
            latitude: location.lat,
            longitude: location.lng,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
        }),
    });

    const { current, destination, coordinate } = state;

    const mapRef = useRef();
    const markerRef = useRef();

    useEffect(() => {
        fetchNearbyParking();

        const savedRecentSearches = [];
        setRecentSearches(savedRecentSearches);
    }, []);

    useEffect(() => {
        if (item && recommendedPlaces.length > 0) {
            const found = recommendedPlaces.find((place) => place.id === item.id);
            if (!found) {
                setRecommendedPlaces((prev) => [
                    ...prev,
                    {
                        id: item.id,
                        managementName: item.managementName,
                        parkingPay: item.parkingPay,
                        latitude: item.coordinates.lat,
                        longitude: item.coordinates.lng,
                    },
                ]);
            }
            setState((prevstate) => ({
                ...prevstate,
                destination: { latitude: item.coordinates.lat, longitude: item.coordinates.lng },
            }));
            setShowDirections(true);
        }
    }, [recommendedPlaces]);

    useEffect(() => {
        if (initialDestination) {
            setState((prevState) => ({
                ...prevState,
                destination: initialDestination,
            }));
            setSelectedPlaceName(initialDestination.managementName);
            setSelectedParkingPay(initialDestination.parkingPay);
            setAvailableSlots(initialDestination.availableSlots);
            setShowDirections(true);
        }
    }, [initialDestination]);

    // Fetch location every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            getCurrentLoc();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchNearbyParking = async () => {
        console.log("Fetching parking spots...");
        const center = [location.lat, location.lng];
        const radiusInM = 100 * 1000; // 100 km
    
        const bounds = geofire.geohashQueryBounds(center, radiusInM);
        const promises = bounds.map(b => {
            const q = query(collection(db, "establishments"), orderBy("geohash"), startAt(b[0]), endAt(b[1]));
            return getDocs(q);
        });
    
        try {
            const snapshots = await Promise.all(promises);
            const matchingDocs = [];
    
            snapshots.forEach(snap => {
                snap.docs.forEach(async doc => {
                    const establishment = doc.data();
                    const lat = establishment.coordinates.lat;
                    const lng = establishment.coordinates.lng;
                    const distanceInKm = geofire.distanceBetween([lat, lng], center);
                    const distanceInM = distanceInKm * 1000;
    
                    if (distanceInM <= radiusInM) {
                        const slotDataSnapshot = await getDocs(collection(db, `slot/${establishment.managementName}/slotData`));
                        const occupiedSlots = slotDataSnapshot.size;
                        const totalSlots = parseInt(establishment.totalSlots);
                        const availableSlots = totalSlots - occupiedSlots;
    
                        matchingDocs.push({
                            id: doc.id,
                            availableSlots: availableSlots,
                            managementName: establishment.managementName,
                            parkingPay: establishment.parkingPay,
                            latitude: lat,
                            longitude: lng,
                        });
                    }
                });
            });
            console.log("Recommended Places:", matchingDocs);
            setRecommendedPlaces(matchingDocs);
        } catch (error) {
            console.error("Error fetching parking data:", error);
        }
    };
    

    const getCurrentLoc = async () => {
        const currentLocation = await Location.getCurrentPositionAsync({});

        if (currentLocation) {
            const latitude = currentLocation.coords.latitude;
            const longitude = currentLocation.coords.longitude;

            console.log("Getting location...", latitude, longitude);
            animate(latitude, longitude);
            updateLoc(currentLocation);
            setState((prevstate) => ({
                ...prevstate,
                current: { latitude, longitude },
                coordinate: new AnimatedRegion({
                    latitude: latitude,
                    longitude: longitude,
                    latitudeDelta: LATITUDE_DELTA,
                    longitudeDelta: LONGITUDE_DELTA,
                }),
            }));
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

    const animate = (latitude, longitude) => {
        const newCoordinate = { latitude, longitude };
        if (markerRef.current) {
            markerRef.current.animateMarkerToCoordinate(newCoordinate, 7000);
        }
    };

    const handleMarkerClick = (coordinates, name, parkingPay, slots) => {
        setState((prevstate) => ({
            ...prevstate,
            destination: coordinates,
        }));
        setSelectedPlaceName(name);
        setSelectedParkingPay(parkingPay);
        setAvailableSlots(slots);
        setShowDirections(true);
        console.log("Button clicked!", name);
    };

    const handleSelectLocation = (managementName) => {
        navigation.navigate("reservation", { item: { managementName: selectedPlaceName, parkingPay: selectedParkingPay } });
        console.log("Navigating with place:", selectedPlaceName);
    };

    return (
        <SafeAreaView style={styles.containerStyle}>
            <View style={styles.mapStyle}>
                <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={StyleSheet.absoluteFillObject}
                initialRegion={{
                    ...current,
                    latitudeDelta: LATITUDE_DELTA,
                    longitudeDelta: LONGITUDE_DELTA,
                }}
                >
              <Marker.Animated coordinate={coordinate} title="YOU" pinColor="blue" />
                    {recommendedPlaces.map((place) => (
                        <Marker
                            key={place.id}
                            coordinate={{ latitude: place.latitude, longitude: place.longitude }}
                            title={place.managementName}
                            pinColor="red"
                            onPress={() => handleMarkerClick(
                                { latitude: place.latitude, longitude: place.longitude },
                                place.managementName,
                                place.parkingPay,
                                place.availableSlots
                            )}
                        />
                    ))}
                    {showDirections && (
                        <MapViewDirections
                            origin={current}
                            destination={destination}
                            apikey={API_KEY}
                            strokeWidth={3}
                            strokeColor="hotpink"
                        />
                    )}
                </MapView>
            </View>
            {/* Info and action container at the bottom */}
            <View style={styles.infoContainer}>
                <Text style={styles.infoText}>Parking Place: {selectedPlaceName}</Text>
                <Text style={styles.infoText}>Parking Pay: {selectedParkingPay}</Text>
                <View style={styles.divider} />
                <Text style={styles.infoText2}>Available Slots: {availableSlots}</Text>
                <Button
                    title="Select Location"
                    buttonStyle={{ backgroundColor: '#007bff' }}
                    containerStyle={styles.buttonContainer}
                    onPress={handleSelectLocation}
                />
            </View>
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    menuBarStyle: {
        width: 240,
        backgroundColor: "#f2f2f2",
        shadowColor: "rgba(0, 0, 0, 0.3)",
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.6,
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 16,
    },
    containerStyle: {
        flex: 1,
        backgroundColor: "#fff", // Ensures no unstyled background peeks through
    },
    buttonContainer: {
        marginTop: 10,
        borderRadius: 10,
        width: "90%", // Full width minus padding for aesthetic spacing
        alignSelf: "center", // Centers the button in the available space
    },
    containerStyle: {
        flex: 1,
        display: "flex",
    },

    mapStyle: {
        flex:1,
        height: "100%",
        width: "100%",
    },

    searchContainerStyle: {
        height: 60,
        position: "absolute",
        top: Constants.statusBarHeight + 10,
        left: 0,
        right: 0,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1,
        backgroundColor: "black",
        paddingHorizontal: 16,
        paddingTop: 10,
        shadowColor: "rgba(0, 0, 0, 0.3)",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.6,
        elevation: 3,
    },
    infoContainer: {
        padding: 20,
        backgroundColor: "#fff",
        borderTopLeftRadius: 45,
        borderTopRightRadius: 45,
        width: "100%",
        position: "absolute",
        bottom: 0, // Ensures that this container sits at the bottom
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#FFD700",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 30,
    },
    infoText: {
        fontSize: 16,
        color: "#333",
        fontFamily: 'Copperplate',
    },
    infoText2: {
        fontSize: 16,
        color: "green",
        fontFamily: 'Copperplate',
    },
    divider: {
        width: "90%", // Makes the divider slightly shorter than the container width
        height: 1, // Thin line
        backgroundColor: "#ddd", // Light grey color
        marginVertical: 8, // Adds space above and below the divider
    },
});

export default Map;