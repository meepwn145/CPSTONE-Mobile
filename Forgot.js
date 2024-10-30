import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import {auth} from "./config/firebase";

  
  const isEmailValid = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const ForgotScreen = () => {
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState(null);
    const [enteredCode, setEnteredCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isCodeSubmitted, setIsCodeSubmitted] = useState(false);
  
  
    const handleSubmit = async () => {
      if (!isEmailValid(email)) {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
        return;
      }
  
      try {
        await sendPasswordResetEmail(auth, email);
        Alert.alert('Success', 'Password reset email sent. Check your inbox.');
      } catch (error) {
        console.error('Error sending password reset email:', error.message, 'Code:', error.code);
        handleFirebaseError(error);
      }
    };

    const handleFirebaseError = (error) => {
      switch (error.code) {
        case 'auth/invalid-email':
          Alert.alert('Error', 'Invalid email format.');
          break;
        case 'auth/user-not-found':
          Alert.alert('Error', 'User with this email does not exist.');
          break;
        default:
          Alert.alert('Error', 'An error occurred. Please try again later.');
          break;
      }
    };


  return (
    <View style={styles.container}>
      <View style={styles.navbar}>
        <Text style={styles.navbarTitle}>SpotWise Parking Management</Text>
      </View>
      <Text style={styles.label}>Enter your email address:</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Button title="Reset Password" onPress={handleSubmit} />
      <Text style={styles.message}></Text>
    </View>
  );
};

const styles = StyleSheet.create({
  message: {
    marginTop: 20,
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
  },
container: {
    flex: 1,
    padding: 20,
    alignItems: 'stretch',
},
  header: {
    fontSize: 24,
    marginBottom: 20,
  },
  label: {
    marginBottom: 5,
    fontSize: 16,
    marginTop: 50,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  navbar: {
    backgroundColor: 'black',
    padding: 10,
    height: 80,
  },
  navbarTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 20,
    marginTop: 20,
  },
  codeForm: {
    marginTop: 20,
    alignItems: 'center',
  },
  codeLabel: {
    marginBottom: 5,
    fontSize: 16,
  },
  codeInput: {
    width: 120,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
});

export default ForgotScreen;
