import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Card } from "react-native-elements";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./config/firebase";

export default function DetailsScreen({ route }) {
    const { item } = route.params;
    const navigation = useNavigation();

    // State to store the available parking slots
    const [availableSlots, setAvailableSlots] = useState(0);

    const fetchParkingSlots = async (managementName) => {
        try {
            const establishmentQuery = query(collection(db, "establishments"), where("managementName", "==", managementName));
            const establishmentSnapshot = await getDocs(establishmentQuery);
            if (establishmentSnapshot.empty) {
                console.log("No matching establishments found.");
                return { totalSlots: 0, availableSlots: 0 };
            }

            let totalSlots = 0;
            establishmentSnapshot.forEach(doc => {
                totalSlots = doc.data().totalSlots;
            });

            const slotDataQuery = query(collection(db, `slot/${managementName}/slotData`));
            const slotDataSnapshot = await getDocs(slotDataQuery);
            const occupiedSlots = slotDataSnapshot.size;

            const available = totalSlots - occupiedSlots;
            setAvailableSlots(available);  // Update the state with the available slots
        } catch (error) {
            console.error("Error fetching parking data: ", error);
            setAvailableSlots(0);  // Set available slots to 0 in case of an error
        }
    };

    // Fetch available slots when the component mounts or item changes
    useEffect(() => {
        if (item && item.managementName) {
            fetchParkingSlots(item.managementName);
        }
    }, [item]);

    const navigateToMapWithDirections = () => {
        navigation.navigate("Map", {
            from: item,
            destination: {
                latitude: item.coordinates.lat,
                longitude: item.coordinates.lng,
                managementName: item.managementName,
                parkingPay: item.parkingPay,
                availableSlots: availableSlots,
            },
        });
    };

    

    return (
        <View style={styles.container}>
            <Image source={{ uri: 'https://i.imgur.com/WwPGlNh.png' }} style={styles.backgroundImage} />
            <Image source={{ uri: 'https://i.imgur.com/Tap1nZy.png' }} style={[styles.backgroundImage, { borderTopLeftRadius: 50, marginTop: 70, borderTopRightRadius: 50 }]} />
            <Text style={styles.titleText}>Details</Text>

            <Card containerStyle={styles.cardContainer}>
                <View>
                    <Text style={styles.headerName}>{item.managementName}</Text>
                    <Image  source={item.profileImageUrl ? { uri: item.profileImageUrl } : require("./images/SPOTWISE.png")}
                     style={styles.image}/>
                    <Text style={styles.para1}>Open at: {item.openTime} A.M until {item.closeTime} P.M</Text>
                    <Text style={styles.para}>Located at</Text>
                    <Text style={styles.address}>{item.companyAddress}</Text>
                    <Text style={styles.address}>Parking Pay: {item.parkingPay}.00</Text>
                    <Text style={styles.available}>Available Parking Space: {availableSlots}</Text>
                </View>
            </Card>

            <TouchableOpacity onPress={() => navigation.navigate("reservation", { item: item })} style={styles.buttonReserve}>
                <Text style={styles.buttonText1}>Reserve</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={navigateToMapWithDirections} style={styles.button}>
            <Text style={styles.buttonText}>Direction</Text>
        </TouchableOpacity>
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    titleText: {
        color: "white",
        fontSize: 50,
        fontWeight: "bold",
        textAlign: "center",
        marginTop: 4,
    },
    para1: {
        fontSize: 14,
        marginTop: 10,
        color: "gray",
        fontFamily: 'Copperplate',
    },
    para: {
        fontSize: 14,
        marginTop: 10,
        fontFamily: 'Copperplate',
    },
    available: {
        fontSize: 14,
        marginTop: 10,
        fontFamily: 'Copperplate',
        color: 'green',
    },
    address: {
        color: "gray",
        fontSize: 15,
        fontFamily: 'Copperplate',
    },
    image: {
        marginTop: 10,
        marginLeft: 75,
        width: 200,
        height: 200,
        resizeMode: "cover",
        marginBottom: 10,
    },
    button: {
        backgroundColor: "#39e75f",
        paddingVertical: 15,
        borderRadius: 100,
        alignItems: "center",
        paddingHorizontal: 24, // Removed duplicate property
        marginTop: -20, // Adjusted marginTop
        marginBottom: 80, // Adjusted marginBottom
        width: "90%",
        alignSelf: "center",
    },
    buttonReserve: {
        borderColor: "#87CEEB",
        backgroundColor: "white",
        paddingVertical: 15,
        borderRadius: 100,
        alignItems: "center",
        borderWidth: 2,
        marginTop: 20, // Adjusted marginTop
        marginBottom: 30, // Adjusted marginBottom
        width: "90%",
        alignSelf: "center",
    },
    cardContainer: {
        marginTop: "4%",
        borderWidth: 1,
        borderColor: "#FFD700",
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        marginHorizontal: 15,
        elevation: 15, // Shadow
    },
    buttonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
    buttonText1: {
        color: "#87CEEB",
        fontSize: 16,
        fontWeight: "bold",
    },
    headerName: {
        fontSize: 20,
        marginTop: 10,
        fontWeight:'bold',
        color: "#87CEEB",
        textAlign:'center',
    },
    backgroundImage: {
        ...StyleSheet.absoluteFillObject,
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
});
