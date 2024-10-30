import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';

const ReservationDetailsScreen = ({ route, navigation, setReservedSlots }) => {
  const { selectedSlot, reservedSlots } = route.params;
  const [isModalVisible, setModalVisible] = useState(false);

  // Extract totalAmount from route.params
  const { totalAmount } = route.params;

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const handleCancel = () => {
    toggleModal();

    // Handle cancellation logic if needed
    // Update reserved slots state
    const updatedReservedSlots = reservedSlots.filter((slot) => slot !== selectedSlot);
    setReservedSlots(updatedReservedSlots);

    // Navigate back to the ReservationScreen with updated reservation data
    navigation.navigate('ReservationScreen', {
      selectedSlot: null,
      reservedSlots: updatedReservedSlots,
      totalAmount: updatedReservedSlots.length * SLOT_PRICE,
    });
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reservation Details</Text>
      <Text style={styles.detailsText}>Reserved Request Slot: {selectedSlot}</Text>
      <Text style={styles.detailsText}>Reserved Slots: {renderReservedSlots(reservedSlots)}</Text>
      <Text style={styles.detailsText}>Total Amount: PHP{totalAmount}</Text>

      {/* Cancel Button */}
      <TouchableOpacity style={styles.cancelButton} onPress={toggleModal}>
        <Text style={styles.buttonText}>Cancel Reservation</Text>
      </TouchableOpacity>

      {/* Custom Modal */}
      <Modal isVisible={isModalVisible}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Confirmation</Text>
          <Text style={styles.modalText}>{`Are you sure you want to cancel the reservation for Slot ${selectedSlot}?`}</Text>
          <TouchableOpacity style={styles.modalButton} onPress={handleCancel}>
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalButton} onPress={toggleModal}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const renderReservedSlots = (slots) => {
  if (slots.length === 0) {
    return 'Pending..';
  }
  return slots.map((slot) => `Slot ${slot}`).join(', ');
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  detailsText: {
    fontSize: 18,
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  // Modal styles
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
});

export default ReservationDetailsScreen;