import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export default function ReceiptScreen({ route }) {
  const { gcashNumber, amount } = route.params;

  const receiptData = {
    gcashNumber,
    amount,
   
  };

  const jsonString = JSON.stringify(receiptData);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Successfully sent to</Text>
      <Text style={styles.amountText}>PHP  {amount}</Text>
      <Text style={styles.receiptText}>Mobile No. {gcashNumber}</Text>
      <View style={styles.qrCodeContainer}>
        <QRCode value={jsonString} size={200} />
      </View>
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
    marginBottom: 30,
    color: '#898E8D',
  },
  receiptText: {
    fontSize: 18,
    marginBottom: 10,
    color: '#898E8D',
    marginTop: 20,
  },
  amountText: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
    color: '#898E8D',
  },
  qrCodeContainer: {
    marginTop: 30,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    elevation: 3,
  },
});
