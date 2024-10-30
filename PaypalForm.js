import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function PaypalForm() {
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const handleConfirmPayment = () => {

    setTimeout(() => {
      setPaymentConfirmed(true);
    }, 1000);
  };

  return (
    <View style={styles.formContainer}>
      {!paymentConfirmed ? (
        <>
          <Text style={styles.header}>Payment Confirmation</Text>
          <Text style={styles.label}>Payment to:</Text>
          <Text style={styles.merchant}>Manang Berting Parking Lot</Text>
          <Text style={styles.label}>Amount:</Text>
          <Text style={styles.amount}>PHP 100.00</Text>
          <TouchableOpacity style={styles.button} onPress={handleConfirmPayment}>
            <Text style={styles.buttonText}>Confirm Payment</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.receiptContainer}>
          <Text style={styles.receiptHeader}>Payment Successful</Text>
          <Text style={styles.receiptText}>Parking Lot: Manang Berting</Text>
          <Text style={styles.receiptText}>Amount: PHP 100.00</Text>
          <Text style={styles.receiptText}>Email: jasongilbertcanete@gmail.com</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    padding: 20,
    backgroundColor: '#f1f1f1',
    borderRadius: 10,
    marginTop: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  merchant: {
    fontSize: 18,
    marginBottom: 20,
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  receiptContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  receiptHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  receiptText: {
    fontSize: 16,
    marginBottom: 10,
  },
});
