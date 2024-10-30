import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Start } from './Start';
import DashboardScreen from './Dashboard';
import SettingsScreen from './Setting';
import NotificationsScreen from './Notification';
import SearchScreen from './Search';
import MapsScreen from './Map';
import NextScreen from './Next';
import LoginScreen from './Login';
import SignupScreen from './SignUp';
import Profs from './Profiles'
import FeedbackScreen from './Feedback'
import DetailsScreen from './Details'
import TransactionScreen from './Transaction';
import GcashScreen from "./GcashForm"
import PaypalScreen from "./PaypalForm"
import ReceiptScreen from "./ReceiptForm"
import ParkScreen from "./Park"
import ForgotScreen from "./Forgot"
import UserProvider from './UserProvider';
import reservationScreen from './reservation'
import ReservationDetailsScreen from './reservationDetails';
import registerNNPushToken from 'native-notify';
const Stack = createNativeStackNavigator();

export default function App() {
  registerNNPushToken(23768, '6W2xCaWiR8rBZCBR7UUCkv');

  return (
    
    <NavigationContainer>
      <UserProvider>
      <Stack.Navigator initialRouteName="Start">
        <Stack.Screen name="Start" component={Start} options={{ headerShown: false }} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="Map" component={MapsScreen} />
        <Stack.Screen name="Next" component={NextScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignupScreen} />
        <Stack.Screen name="Profiles" component={Profs} />
        <Stack.Screen name="Feedback" component={FeedbackScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
        <Stack.Screen name="Transaction" component={TransactionScreen} />
        <Stack.Screen name="GcashForm" component={GcashScreen} />
        <Stack.Screen name="PaypalForm" component={PaypalScreen} />
        <Stack.Screen name="ReceiptForm" component={ReceiptScreen} />
        <Stack.Screen name="Park" component={ParkScreen} />
        <Stack.Screen name="Forgot" component={ForgotScreen} />
        <Stack.Screen name="reservation" component={reservationScreen}/>
        <Stack.Screen name="reservationDetails" component={ReservationDetailsScreen} />
      </Stack.Navigator>
      </UserProvider>
    </NavigationContainer>
  );
}
