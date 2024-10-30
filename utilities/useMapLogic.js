import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, startAt, endAt } from "firebase/firestore";
import { Dimensions } from "react-native";
import * as geofire from "geofire-common";
import * as Location from "expo-location";
import { db } from "../config/firebase";
import { AnimatedRegion } from "react-native-maps";

const screen = Dimensions.get("window");
const LATITUDE_DELTA = 0.03;
const ASPECT_RATIO = screen.width / screen.height;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

export const useMapLogic = () => {
    const [recommendedPlaces, setRecommendedPlaces] = useState([]);
    const [currentLocation, setCurrentLocation] = useState({
        latitude: null,
        longitude: null,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
    });
    const [destination, setDestination] = useState({});
    const [showDirections, setShowDirections] = useState(false);

    useEffect(() => {
        // Request location permissions and fetch current location
        const getCurrentLocation = async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.error("Location permission not granted");
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            setCurrentLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA,
            });
            fetchNearbyEstablishments(location.coords);
        };

        getCurrentLocation();
    }, []);

    const fetchNearbyEstablishments = async (coords) => {
        const center = [coords.latitude, coords.longitude];
        const radiusInM = 5000; // 5 kilometers

        const bounds = geofire.geohashQueryBounds(center, radiusInM);
        const promises = bounds.map((b) => {
            const q = query(collection(db, "establishments"), orderBy("geohash"), startAt(b[0]), endAt(b[1]));
            return getDocs(q);
        });

        try {
            const snapshots = await Promise.all(promises);
            let matchingDocs = [];

            for (const snap of snapshots) {
                for (const doc of snap.docs) {
                    const establishment = doc.data();
                    const lat = establishment.coordinates.lat;
                    const lng = establishment.coordinates.lng;
                    const distanceInKm = geofire.distanceBetween([lat, lng], center);
                    const distanceInM = distanceInKm * 1000;
                    if (distanceInM <= radiusInM) {
                        matchingDocs.push({ ...establishment, id: doc.id });
                    }
                }
            }

            matchingDocs.sort((a, b) => a.distance - b.distance);
            setRecommendedPlaces(matchingDocs);
        } catch (error) {
            console.error("Error fetching nearby establishments:", error);
        }
    };

    const handleSelectDestination = (place) => {
        setDestination({
            latitude: place.coordinates.lat,
            longitude: place.coordinates.lng,
        });
        setShowDirections(true); // Assuming you will handle actual directions rendering in a map component
    };

    return {
        recommendedPlaces,
        currentLocation,
        destination,
        showDirections,
        handleSelectDestination
    };
};
