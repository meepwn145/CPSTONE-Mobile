import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserContext from './UserContext';
import { getAuth, onAuthStateChanged } from 'firebase/auth';  // Import Firebase auth functions
import { doc, getDoc } from 'firebase/firestore';
import { db } from "./config/firebase";

function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Load user from AsyncStorage when the app is loaded
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.log("Failed to load user from AsyncStorage:", e);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log("Firebase Auth User ID:", firebaseUser.uid); // Log the user ID from Firebase Auth
        const userDocRef = doc(db, "user", firebaseUser.uid); // Assuming UID is the key
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            console.log("Document exists, data:", docSnap.data()); // Log the data fetched
            const extendedUserData = docSnap.data();
            const userData = {
              email: firebaseUser.email,
              carPlateNumber: extendedUserData.carPlateNumber,
              
            };
            setUser(userData);
            AsyncStorage.setItem('user', JSON.stringify(userData)).catch(e => {
              console.log("Failed to save user to AsyncStorage:", e);
            });
          } else {
            console.log("No document with ID:", firebaseUser.uid); // Explicitly log when no document is found
          }
        } catch (error) {
          console.error("Error fetching user data from Firestore:", error);
        }
      } else {
        console.log("No user logged in");
        setUser(null);
      }
    });
  
    return () => unsubscribe();
  }, []);
  

  useEffect(() => {
    // Update AsyncStorage whenever the user state changes
    const saveUser = async () => {
      try {
        if (user) {
          await AsyncStorage.setItem('user', JSON.stringify(user));
        } else {
          await AsyncStorage.removeItem('user');
        }
      } catch (e) {
        console.log("Failed to save/remove user to/from AsyncStorage:", e);
      }
    };

    saveUser();
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export default UserProvider;