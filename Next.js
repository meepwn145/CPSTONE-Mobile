import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Image} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function AnimatedCarScreen() {
  const navigation = useNavigation();

  useEffect(() => {

    const timer = setTimeout(() => {
      navigation.navigate('Login');
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
    <Image    
   
      style={styles.backgroundImage}
    />
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF', 
  },
  text: {
    marginTop: 20,
    fontSize: 15,
    color: 'black', 
    fontFamily: 'Courier New',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject, 
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
});
