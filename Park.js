import React, { useState } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions, TouchableOpacity, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, Title, Paragraph, RadioButton } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

const SCREEN_WIDTH = Dimensions.get('window').width;

function ParkScreen() {
  const navigation = useNavigation();
  const [selectedTimeOption, setSelectedTimeOption] = useState('Today');
  const [endTime, setEndTime] = useState('10:40 pm');
  const [alertBefore, setAlertBefore] = useState(false);
  const [slideX] = useState(new Animated.Value(0));
  const [confirmed, setConfirmed] = useState(false);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: Animated.event([null, { dx: slideX }], { useNativeDriver: false }),
    onPanResponderRelease: (e, { dx }) => {
      if (dx > SCREEN_WIDTH * 0.5) {
        Animated.timing(slideX, {
          toValue: SCREEN_WIDTH - 100,  // Adjusting to leave some space for visual effect
          duration: 200,
          useNativeDriver: false,
        }).start(() => {
          setConfirmed(true);
          setTimeout(() => {
            navigation.navigate('Transaction');
          }, 500);
        });
      } else {
        Animated.spring(slideX, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      }
    },
  });

  return (
   
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
       
      </View>
      <View style={styles.cardContainer}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Country Mall</Title>
            <Paragraph style={styles.subtitle}>Slot 4 Ground Floor</Paragraph>
            <Paragraph style={styles.subtitle}>20PHP</Paragraph>
          </Card.Content>
        </Card>
        <View style={styles.timeContainer}>
          <Text style={styles.endTimeLabel}>End time</Text>
          <View style={styles.timeOptions}>
            {[].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.timeOption,
                  selectedTimeOption === option && styles.selectedTimeOption,
                ]}
                onPress={() => setSelectedTimeOption(option)}
              >
                <Text
                  style={[
                    styles.timeOptionText,
                    selectedTimeOption === option && styles.selectedTimeOptionText,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.endTime}>{endTime}</Text>
          <View style={styles.alertContainer}>
            <RadioButton
              value="alert"
              status={alertBefore ? 'checked' : 'unchecked'}
              onPress={() => setAlertBefore(!alertBefore)}
              color="#FFB400"
            />
            <Text style={styles.alertText}>Alert me 15 mins before</Text>
          </View>
        </View>
      </View>
      <View style={styles.slideContainer} >
        <View style={styles.slideButtonBackground} >
          <Animated.View
            {...panResponder.panHandlers}
            style={[styles.slideButton, { transform: [{ translateX: slideX }] }]}
          >
            <Icon name="chevron-right" size={30} color="#FFB400" />
          </Animated.View>
          <Text style={styles.slideButtonText}>{confirmed ? "Confirmed" : "Slide to View Establishment"}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#132B4B', // Adding a slight overlay to improve text readability
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  backButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 10,
  },
  backButtonText: {
    fontSize: 20,
    color: '#132B4B',
  },
  menuButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 10,
  },
  menuButtonText: {
    fontSize: 20,
    color: '#FFB400',
  },
  cardContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#132B4B',
    borderRadius: 20,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFB400',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  timeContainer: {
    marginTop: 20,
  },
  endTimeLabel: {
    fontSize: 18,
    color: '#555',
    marginBottom: 10,
    textAlign: 'center',
  },
  timeOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  timeOption: {
    marginHorizontal: 10,
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  selectedTimeOption: {
    backgroundColor: '#132B4B',
  },
  timeOptionText: {
    fontSize: 16,
    color: '#FFB400',
  },
  selectedTimeOptionText: {
    color: '#fff',
  },
  endTime: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  alertContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  alertText: {
    fontSize: 16,
    color: '#555',
  },
  slideContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  slideButtonBackground: {
    width: SCREEN_WIDTH - 40,
    height: 60,
    backgroundColor: '#333',
    borderRadius: 30,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    marginTop: '5%'
  },
  slideButton: {
    backgroundColor: 'WHITE',
    height: 60,
    width: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  slideButtonText: {
    color: '#aaa',
    fontSize: 18,
    fontWeight: 'bold',
    position: 'absolute',
    left: 70,
    zIndex: -1,
  },
});

export default ParkScreen;
