import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';

export function Start({ navigation }) {
  const handleGoToDashboard = () => {
    navigation.navigate('Next');
  };
  const handleGoToSignIn = () => {
    navigation.navigate('SignUp');
  };
  return (

    <View style={styles.container}>
      <ImageBackground
          source={{ uri: 'https://i.imgur.com/EQcI2Ut.png' }}
        style={styles.backgroundImage}
      >

        <View style={styles.overlay}>
          <Text style={{color: 'white', fontSize: 50, fontWeight: 'bold', marginBottom: '1%'}}>
            Start with us Today  
          </Text>  
          <Text style={styles.startText}>Find a suitable parking area near your location</Text>
          <TouchableOpacity style={styles.button} onPress={handleGoToDashboard}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonSignup} onPress={handleGoToSignIn}>
            <Text style={styles.buttonSignupText}>Signup</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  startText: {
    color: '#E9DBBD',
    fontSize: 20, 
    marginTop: 30,
    fontFamily: 'Courier New',
    textAlign: 'center',
  },
  button: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: '32%',
    backgroundColor: '#39e75f',
    borderRadius: 20,
    marginTop: 40,
    borderWidth: 3,
    borderColor: '#39e75f',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Courier New',
    textAlign: 'center',
  },
  buttonSignup:{
    paddingVertical: 10,
    paddingHorizontal: '31%',
    backgroundColor: 'white',
    borderRadius: 50,
    marginTop: 15,
    borderWidth: 3,
    borderColor: '#87CEEB',
    
  },
  buttonSignupText: {
    color: '#87CEEB',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Courier New',
    textAlign: 'center',
  },
});

export default Start;