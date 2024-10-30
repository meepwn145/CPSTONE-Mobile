import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function PaymentMethodPage() {
  const [selectedOption, setSelectedOption] = useState(null);
  const navigation = useNavigation();

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    if (option === 'gcash') {
      navigation.navigate('GcashForm');
    } else if (option === 'paypal') {
      navigation.navigate('PaypalForm');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Payment Method</Text>
      <TouchableOpacity
        style={[styles.optionContainer, selectedOption === 'gcash' && styles.selectedOption]}
        onPress={() => handleOptionSelect('gcash')}
      >
        <View style={styles.logoContainer}>
          <Image
             source={{ uri: 'https://i.imgur.com/hLMbgxO.png' }}
              style={styles.logo}
          />
        </View>
        <Text style={styles.optionText}>Gcash</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.optionContainer, selectedOption === 'paypal' && styles.selectedOption]}
        onPress={() => handleOptionSelect('paypal')}
      >
        <View style={styles.logoContainer}>
          <Image
            source={{ uri: 'https://i.imgur.com/F6MiHU2.png' }}
            style={styles.logo}
          />
        </View>
        <Text style={styles.optionText}>PayPal</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  optionContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    width: 300,
    alignItems: 'center',
    elevation: 3,
  },
  selectedOption: {
    backgroundColor: '#4CAF50',
  },
  optionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10, 
  },
  logoContainer: {
    width: 60, 
    height: 40, 
    marginRight: 10, 
  },
  logo: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    borderRadius: 15
  },
});
