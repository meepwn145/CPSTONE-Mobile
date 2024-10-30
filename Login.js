import React, { useState, useEffect } from 'react';
import {View, Text, TextInput, StyleSheet, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from './config/firebase';
import { registerIndieID } from 'native-notify';
import { collection, query, where, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { getIdToken } from 'firebase/auth'; // Import this to get the ID token
import { onAuthStateChanged } from 'firebase/auth';

export function LoginScreen() {
  const navigation = useNavigation();
  const [userReservation, setUserReservation] = useState(null); // Declare user reservation state
  const resetReservationState = () => {
    setUserReservation(null); // Clear the current reservation data
  };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleGoToDashboard = (user) => {
    navigation.navigate('Profiles', { user });
};

  const handleForgotPassword = () => {
    navigation.navigate('Forgot');
  };

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      if (!userCredential || !userCredential.user) {
        console.error('User not found in userCredential');
        return;
      }

      const { user } = userCredential;
      console.log('Authentication successful for UID:', user.uid);

      // Step 1: Retrieve the access token (ID token)
      const accessToken = await user.getIdToken(); // Retrieve the ID token (access token)
      console.log('Access Token:', accessToken);

      // Optional: Store the token in Firestore for later use
      const userDocRef = doc(db, 'userTokens', user.email);
      await setDoc(userDocRef, {
        token: accessToken,
        email: user.email,
        timestamp: new Date(),
      });

      // Step 2: Register the Indie ID for Native Notify
      try {
        await registerIndieID(user.email, 24190, '7xmUkgEHBQtdSvSHDbZ9zd');
        console.log('Indie ID registration successful for email:', user.email);
      } catch (error) {
        console.error('Error during Indie ID registration:', error);
      }

      // Step 3: Navigate to the dashboard with the user and token info
      const userDoc = await getDoc(doc(db, 'user', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        navigation.navigate('Dashboard', { user: userData, token: accessToken, uid: user.uid });
      } else {
        console.error("No user data found in Firestore for user: ${user.uid}");
      }
    } catch (error) {
      console.error('Error logging in:', error.message || error);
    }
  };

  const handleGoToSignIn = () => {
    navigation.navigate('SignUp');
  };
  
  const handleRememberMe = () => {
    setRememberMe(!rememberMe);
  };
  

  return (
    <View style={styles.container}>
     <Image
  source={{ uri: 'https://i.imgur.com/LtYGuTl.png' }}
  style={styles.backgroundImage}
/>
    <Image
     source={{ uri: 'https://i.imgur.com/Tap1nZy.png' }}
      style={[styles.backgroundImage, { borderTopLeftRadius: 130, marginTop: 100}]}
    />
    <Text style={{marginTop: 6, marginLeft: '35%', fontSize: 50, fontWeight: 'bold', color: 'white', marginVertical: 10}}>Login</Text>
    <View style={styles.formContainer}>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        style={styles.input}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        style={styles.input}
      />
      <View style={styles.rememberMeContainer}>
        <TouchableOpacity onPress={handleRememberMe} style={styles.checkbox}>
          {rememberMe && <View style={styles.checkboxInner} />}
        </TouchableOpacity>
        <Text style={styles.rememberMeText}>Remember me</Text>
        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot password?</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.button2} onPress={handleLogin}>
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, {borderColor: '#87CEEB'}]} onPress={handleGoToSignIn}>
      <Text style={[styles.buttonText, {color: '#87CEEB'}]}>Create Account</Text>
      </TouchableOpacity>
      <View style={styles.separator}>
          <View style={styles.line} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.line} />
        </View>
        <View style={styles.logoContainer}>
  <TouchableOpacity style={styles.socialButton}>
    <Image
  source={{ uri: 'https://i.imgur.com/djoqq8E.png' }}
        style={styles.logo}
    />
  </TouchableOpacity>
  <TouchableOpacity style={styles.socialButton}>
    <Image
      source={{ uri: 'https://i.imgur.com/RHKsn28.png' }}
      style={styles.logo2}
    />
  </TouchableOpacity>
  <TouchableOpacity style={styles.socialButton}>
    <Image
  source={{ uri: 'https://i.imgur.com/yx3frJ6.png' }}
        style={styles.logo2}
    />
         
  </TouchableOpacity>
</View>
<TouchableOpacity onPress={handleGoToSignIn}>
           <Text style={{color: '#d3d3d3', marginTop: 15, textAlign: 'center'}}>Dont have an account? <Text style={{color: '#FFD700', fontWeight: 'bold'}}>Signup</Text></Text>
        </TouchableOpacity>
          </View>
        </View>
 
 

);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  signupText: {
    color: 'red', // or any other color you prefer
  },
  formContainer: {
    padding: 40,
    marginTop: '20%',
    fontFamily: 'Courier New',
  },
  input: {
    backgroundColor: '#DEDEDE',
    borderRadius: 100,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
    fontFamily: 'Courier New',
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 50,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#808080',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxInner: {
    width: 12,
    height: 12,
    backgroundColor: '#3b89ac',
  },
  rememberMeText: {
    flex: 1,
    fontSize: 14,
    color: '#d3d3d3',
    fontWeight: 'bold',
    fontFamily: 'Courier New',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#FFD700',
    fontFamily: 'Courier New',
    fontWeight: 'bold'
  },
  button: {
    backgroundColor: 'white',
    paddingVertical: 15,
    borderRadius: 100,
    alignItems: 'center',
    borderWidth: 2,

  },
  button2: {
    backgroundColor: '#39e75f',
    paddingVertical: 15,
    borderRadius: 100,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Courier New',
    
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    color: '#808080',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#FFD700',
  },
  orText: {
    marginHorizontal: 10,
    color: '#FFD700',
    marginBottom: 20,
  },
  socialButton: {
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  socialButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Courier New',
  },
  logoContainer: {
    flexDirection: 'row', // Arrange the logos side by side
    justifyContent: 'space-around', // Space them evenly
    marginBottom: 10,
    marginTop: 10,
  },
  socialButton: {
    alignItems: 'center',
  },
  logo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  logo2: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },

  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

});

export default LoginScreen;