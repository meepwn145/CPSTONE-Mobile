
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, collection, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";

const auth = getAuth();

export const loginUser = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();
        console.log("Access Token:", token);

        // Reference to the user document in the 'users' collection
        const userRef = doc(db, "users", email);

        // Store the token in the user's document
        await setDoc(userRef, { token }, { merge: true });

        // Create or update a document in a subcollection named 'activity' or any other name
        const activityRef = doc(collection(userRef, "activity")); // Create a new document in 'activity' subcollection
        await setDoc(activityRef, {
            timestamp: new Date(), // Example field
            description: "User logged in", // Example field
        }, { merge: true });

        return { user: userCredential.user, token };
    } catch (error) {
        console.error("Login Failed:", error);
        throw error;
    }
};

export const logoutUser = async () => {
    try {
        const email = auth.currentUser.email; // Get the email of the currently logged-in user
        const userRef = doc(db, "users", email); // Reference to the user's document

        // Update the token field in the user's document to remove it
        await updateDoc(userRef, {
            token: ""
        });

        // Sign out the user
        await signOut(auth);
        console.log("User logged out successfully");

        const activityRef = doc(collection(userRef, "activity")); // Create a new document in 'activity' subcollection
        await setDoc(activityRef, {
            timestamp: new Date(), // Example field
            description: "User Logged Out", // Example field
        }, { merge: true });
    } catch (error) {
        console.error("Logout Failed:", error);
        throw error;
    }
};
