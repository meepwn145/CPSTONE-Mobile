import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserContext from './UserContext';
import { getAuth, onAuthStateChanged } from 'firebase/auth';  // Import Firebase auth functions

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
    // Subscribe to Firebase auth state changes
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, update the user state and AsyncStorage
        const userData = {
          email: firebaseUser.email,
          carPlateNumber: firebaseUser.carPlateNumber // Ensure these properties exist or are handled if not
        };
        setUser(userData);
        AsyncStorage.setItem('user', JSON.stringify(userData)).catch(e => {
          console.log("Failed to save user to AsyncStorage:", e);
        });
      } else {
        // User is signed out
        setUser(null);
        AsyncStorage.removeItem('user').catch(e => {
          console.log("Failed to remove user from AsyncStorage:", e);
        });
      }
    });

    // Clean up the subscription
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
