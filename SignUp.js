import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';
import { auth, db } from './config/firebase'; 
import { useNavigation } from '@react-navigation/native';


export function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [car, setCar] = useState('');
  const [carPlateNumber, setCarPlateNumber] = useState('');

  const navigation = useNavigation();

  const handleSignup = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;  

    
      const userRef = doc(db, 'user', user.uid); 
      await setDoc(userRef, {
        name,
        email,
        address,
        contactNumber,
        age,
        gender,
        car,
        carPlateNumber,
        password,
      });

      console.log('Signup successful!');
      Alert.alert('Success', 'Successfully registered!', [{ text: 'OK' }]);
      navigation.navigate('Login');
    } catch (error) {
      console.error('Error signing up: ', error);
      Alert.alert('Error', 'Registration failed. Please try again.', [{ text: 'OK' }]);
    }
};


  return (
    <View style={{backgroundColor: 'white'}}>
    <Image
      source={{ uri: 'https://i.imgur.com/WwPGlNh.png' }}
    style={styles.backgroundImage}
  />
    <Text style={styles.title}>Register</Text>
    <Text style={{color: 'white', fontWeight: 'bold', marginLeft: '30%'}}>Create a new Account</Text>
    <ScrollView contentContainerStyle={styles.container}>
  
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
       <TextInput
        style={styles.input}
        placeholder="Address"
        value={address}
        onChangeText={setAddress}
      />
      <TextInput
        style={styles.input}
        placeholder="Contact Number"
        value={contactNumber}
        onChangeText={setContactNumber}
        keyboardType="phone-pad"
      />
       <TextInput
        style={styles.input}
        placeholder="Age"
        value={age}
        onChangeText={setAge}
      />
     <View style={styles.genderContainer}>
        <Text style={styles.label}>Gender:</Text>
        <TouchableOpacity
          style={[styles.genderOption, gender === 'Male' && styles.selectedGender]}
          onPress={() => setGender('Male')}
        >
          <Text style={styles.genderText}>Male</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.genderOption, gender === 'Female' && styles.selectedGender]}
          onPress={() => setGender('Female')}
        >
          <Text style={styles.genderText}>Female</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Car"
        value={car}
        onChangeText={setCar}
      />
      <TextInput
        style={styles.input}
        placeholder="Car Plate Number"
        value={carPlateNumber}
        onChangeText={setCarPlateNumber}
      />
      <TouchableOpacity style={styles.button} onPress={handleSignup}>
        <Text style={styles.buttonText}>Signup</Text>
      </TouchableOpacity>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'flex-start', // Align content to start from the top
    alignItems: 'stretch', // Stretch child components to match the width
    backgroundColor: '#f0f0f0', // Light background for a modern look
    padding: 40,
    marginTop: 15,
    borderTopLeftRadius: 130,

  },
  title: {
    fontSize: 50,
    fontWeight: 'bold',
    color: 'white', // Darker font for better readability
    alignSelf: 'center', // Center the title 
  },
  input: {
    height: 40,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: '#DEDEDE',
    fontSize: 16, // Larger font size
    borderRadius: 100,

  },
  button: {
    backgroundColor: '#39e75f',
    paddingVertical: 12,
    borderRadius: 100, // Rounded corners for buttons
    marginTop: 20,
    shadowOpacity: 0.3, // Slight shadow for depth
    shadowRadius: 3,
    shadowOffset: { height: 3, width: 0 },
    elevation: 3, // Elevation for Android
  },
  buttonText: {
    textAlign: 'center', // Center text in button
    color: '#fff',
    fontSize: 20,
    fontWeight: '500',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'center', // Center gender options
    alignItems: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333', // Dark label for readability
    marginBottom: 5, // Space between label and options
  },
  genderOption: {
    borderWidth: 0,
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
    paddingVertical: 5,
    paddingHorizontal: 15,
    marginHorizontal: 5, // Add horizontal margin between buttons
    borderRadius: 25,
  },
  selectedGender: {
    borderBottomColor: '#FFD700', // Highlight color for selected gender
    backgroundColor: '#FFD700',
   
  },
  genderText: {
    color: '#333',
    fontSize: 16,
    fontFamily: 'Courier New'
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject, 
    width: '100%',
    height: '100%',
    resizeMode: 'cover' 
  },
});
export default SignupScreen;