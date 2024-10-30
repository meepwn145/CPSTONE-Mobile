import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';

export default function GcashScreen({ navigation }) {
  const [gcashNumber, setGcashNumber] = useState('');
  const [showAmountForm, setShowAmountForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleGcashNumberChange = (text) => {
    setGcashNumber(text);
    setShowAmountForm(false);
    setErrorMessage(''); 
  };

  const handleAmountChange = (text) => {
    setAmount(text);
    setErrorMessage(''); 
  };

  const handleConfirmPayment = () => {
    if (gcashNumber.trim() === '') {
      setErrorMessage('Please enter a GCash number first.');
      return;
    }
    if (gcashNumber.trim().length !== 11) {
      setErrorMessage('GCash number must be exactly 11 digits.');
      return;
    }
    setShowAmountForm(true);
  };

  const handlePayNow = () => {
    if (amount.trim() === '') {
      setErrorMessage('Please enter an amount first.');
      return;
    }
    navigation.navigate('ReceiptForm', {
      gcashNumber,
      amount,
    });
  };

  return (
    <View style={styles.formContainer}>
      <View style={styles.navbar}>
        <Text style={styles.navbarTitle}>Gcash</Text>
        <Text style={styles.subTitle}>Ticket Payment</Text>
      </View>
      <Text style={styles.label}>Enter Gcash Number:</Text>
      <TextInput
        style={styles.input}
        placeholder="Gcash Number"
        value={gcashNumber}
        onChangeText={handleGcashNumberChange}
      />
      {errorMessage !== '' && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}

      {showAmountForm && (
        <>
          <Text style={styles.label}>Enter Amount:</Text>
          <TextInput
            style={styles.input}
            placeholder="Amount"
            value={amount}
            onChangeText={handleAmountChange}
            keyboardType="numeric"
          />
          {errorMessage !== '' && (
            <Text style={styles.errorText}>{errorMessage}</Text>
          )}
        </>
      )}

      <Text style={styles.para}>Please note that several billers charge a service fee</Text>
      <TouchableOpacity style={styles.button} onPress={showAmountForm ? handlePayNow : handleConfirmPayment}>
        <Text style={styles.buttonText}>{showAmountForm ? 'Pay Now' : 'Proceed'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    marginTop: 10,
  },
  navbar: {
    backgroundColor: 'blue',
    padding: 10,
    height: 60,
  },
  navbarTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 18,
    marginTop: 5,
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 12,
    color: 'white',
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginTop: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
  },
  button: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 15,
    marginTop: 15,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  para: {
    color: 'gray',
    fontSize: 12,
    marginTop: 10,
    marginBottom: 5,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
  },
  
});
