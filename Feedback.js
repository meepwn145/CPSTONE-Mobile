import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	TextInput,
	StyleSheet,
	TouchableOpacity,
	Alert,
	FlatList,
	Modal,
	Image,
} from "react-native";
// import StarRating from 'react-native-star-rating';
import { useNavigation } from "@react-navigation/native";
import { db } from "./config/firebase";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

function FeedbackScreen() {
	const [managementName, setManagementName] = useState("");
	const [companyAddress, setCompanyAddress] = useState("");
	const [matchingManagementNames, setMatchingManagementNames] = useState([]);
	const [isModalVisible, setModalVisible] = useState(false);
	const [email, setEmail] = useState("");
	const [message, setMessage] = useState("");
	const [user, setUser] = useState(null);
	const [starCount, setStarCount] = useState(0); // State for storing the star rating
	const navigation = useNavigation();

	useEffect(() => {
		const auth = getAuth();
		const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser);
		});
		return () => unsubscribe();
	}, []);

	const handleSubmit = async () => {
		if (!user) {
			Alert.alert("Error", "You must be logged in to submit feedback.");
			return;
		}
		try {
			await addDoc(collection(db, "feedback"), {
				managementName,
				companyAddress,
				email,
				message,
				starRating: starCount, // Add star rating to the document
				createdAt: new Date(),
			});
			Alert.alert("Success", "Your feedback has been submitted.");
			setManagementName("");
			setCompanyAddress("");
			setEmail("");
			setMessage("");
			setStarCount(0); // Reset star rating after submission
		} catch (error) {
			console.error("Error adding document:", error);
			Alert.alert("Error", "There was an issue submitting your feedback. Please try again.");
		}
	};

	useEffect(() => {
		if (user) {
			setEmail(user.email);
		}
	}, [user]);

	const fetchMatchingNames = async (partialName) => {
		try {
			const q = query(collection(db, "establishments"), where("managementName", ">=", partialName));
			const querySnapshot = await getDocs(q);
			const matchingNames = querySnapshot.docs.map((doc) => doc.data().managementName);
			setMatchingManagementNames(matchingNames);
		} catch (error) {
			console.error("Error searching management names:", error);
		}
	};

	const handleManagementNameChange = (text) => {
		setManagementName(text);
		if (text) {
			fetchMatchingNames(text);
			setModalVisible(true);
		} else {
			setModalVisible(false);
		}
	};

	const handleSuggestionPress = async (name) => {
		setManagementName(name);
		try {
			const q = query(collection(db, "establishments"), where("managementName", "==", name));
			const querySnapshot = await getDocs(q);
			if (!querySnapshot.empty) {
				const data = querySnapshot.docs[0].data();
				setCompanyAddress(data.companyAddress || "");
			} else {
				setCompanyAddress("");
				Alert.alert(
					"No match found",
					"The management name you entered does not match our records."
				);
			}
		} catch (error) {
			console.error("Error searching management name:", error);
			Alert.alert("Error", "An error occurred while searching. Please try again.");
		}
		setMatchingManagementNames([]);
		setModalVisible(false);
	};

	const renderItem = ({ item }) => (
		<TouchableOpacity onPress={() => handleSuggestionPress(item)}>
			<View style={styles.suggestionItem}>
				<Text style={styles.para2}>{item}</Text>
			</View>
		</TouchableOpacity>
	);

	return (
		<View style={styles.container}>
			<Image source={{ uri: "https://i.imgur.com/WwPGlNh.png" }} style={styles.backgroundImage} />
			<Image
				source={{ uri: "https://i.imgur.com/Tap1nZy.png" }}
				style={[
					styles.backgroundImage,
					{ borderTopLeftRadius: 100, borderTopRightRadius: 100, marginTop: 100 },
				]}
			/>
			<Text
				style={{
					marginTop: 6,
					textAlign: "center",
					fontSize: 50,
					fontWeight: "bold",
					color: "white",
				}}
			>
				Feedback
			</Text>
			<View style={styles.formContainer}>
				<View style={styles.inputGroup}>
					<Text style={styles.label}>Management Name</Text>
					<TextInput
						style={styles.input}
						placeholder="Enter management name"
						onChangeText={handleManagementNameChange}
						value={managementName}
					/>
				</View>

				<Modal
					animationType="slide"
					transparent={true}
					visible={isModalVisible}
					onRequestClose={() => {
						Alert.alert("Modal has been closed.");
						setModalVisible(!isModalVisible);
					}}
				>
					<TouchableOpacity
						style={styles.modalOverlay}
						activeOpacity={1}
						onPressOut={() => {
							setModalVisible(false);
						}}
					>
						<View style={styles.modalView}>
							<FlatList
								data={matchingManagementNames}
								renderItem={renderItem}
								keyExtractor={(item) => item}
							/>
						</View>
					</TouchableOpacity>
				</Modal>

				<View style={styles.inputGroup}>
					<Text style={styles.label}>Company Address</Text>
					<TextInput
						style={styles.input}
						placeholder="Company Address"
						value={companyAddress}
						onChangeText={setCompanyAddress}
						editable={false}
					/>
				</View>

				<View style={styles.inputGroup}>
					<Text style={styles.label}>Email</Text>
					<TextInput
						style={styles.input}
						placeholder="your_email@example.com"
						keyboardType="email-address"
						value={email}
						onChangeText={setEmail}
						editable={false}
					/>
				</View>

				<View style={styles.inputGroup}>
					<Text style={styles.label}>Message</Text>
					<TextInput
						style={[styles.input, styles.messageInput]}
						placeholder="Enter your message"
						keyboardType="default"
						value={message}
						onChangeText={setMessage}
						multiline
					/>
				</View>

				<View style={styles.inputGroup}>
					<Text style={styles.label}>Rate Your Experience</Text>
					{/* <StarRating
            disabled={false}
            maxStars={5}
            rating={starCount}
            selectedStar={(rating) => setStarCount(rating)} // Set the star rating state
            starSize={30}
            fullStarColor={'#FFD700'} // Gold color for filled stars
          /> */}
				</View>

				<TouchableOpacity style={styles.buttonSubmit} onPress={handleSubmit}>
					<Text style={styles.buttonText}>Submit</Text>
				</TouchableOpacity>
			</View>

			<Text style={styles.para}>The best praise you can give us is to share your experiences.</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	buttonSubmit: {
		backgroundColor: "#39e75f",
		paddingVertical: 15,
		borderRadius: 100,
		marginBottom: 10,
		alignItems: "center",
	},
	para2: {
		marginTop: 10,
		color: "black",
		marginBottom: 10,
	},
	para: {
		marginTop: 10,
		color: "#C0C0C0",
		marginBottom: 10,
	},
	label: {
		marginBottom: 5,
		fontSize: 16,
		fontWeight: "bold",
	},
	input: {
		height: 40,
		borderColor: "gray",
		borderWidth: 1,
		paddingHorizontal: 10,
		borderRadius: 10,
	},
	button: {
		backgroundColor: "#003851",
		padding: 10,
		borderRadius: 10,
		marginTop: 10,
	},
	buttonText: {
		color: "#fff",
		fontSize: 16,
		fontFamily: "Courier New",
	},
	formContainer: {
		padding: 30,
		marginTop: "15%",
	},
	inputGroup: {
		marginBottom: 20,
	},
	messageInput: {
		height: 100, // Adjust height for multiline input
	},
	modalOverlay: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
	},
	modalView: {
		backgroundColor: "white",
		borderRadius: 20,
		padding: 20,
		maxHeight: "80%",
		width: "80%",
	},
	backgroundImage: {
		...StyleSheet.absoluteFillObject,
		width: "100%",
		height: "100%",
		resizeMode: "cover",
	},
});

export default FeedbackScreen;