import React, { useState, useEffect, useContext } from 'react';
import { ScrollView, TouchableOpacity, Alert, Text, StyleSheet, ActivityIndicator, Image, View } from 'react-native';
import { getUnreadIndieNotificationInboxCount, getIndieNotificationInbox, deleteIndieNotificationInbox } from 'native-notify';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserContext from "./UserContext";

export const fetchUnreadCount = async (user) => {
  if (user && user.email) {
    try {
      const unreadCount = await getUnreadIndieNotificationInboxCount(user.email, 24190, '7xmUkgEHBQtdSvSHDbZ9zd');
      console.log("Unread notifications", unreadCount);
      return unreadCount;
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
      return 0;
    }
  }
  return 0;
};

export default function NotificationInbox() {
  const [data, setData] = useState([]);
  const { user } = useContext(UserContext);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAndSetUnreadCount = async () => {
      const count = await fetchUnreadCount(user);
      setUnreadNotificationCount(count);
      console.log("unreadCount: ", count);
    };

    if (user && user.email) {
      fetchAndSetUnreadCount();
    }
  }, [user?.email]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      if (!user || !user.email) {
        throw new Error("User or user email is undefined");
      }
      const notifications = await getIndieNotificationInbox(user.email, 24190, '7xmUkgEHBQtdSvSHDbZ9zd');
      if (!notifications) {
        throw new Error("Notifications fetch returned undefined");
      }
      const storedReadStatus = await AsyncStorage.getItem('readNotifications');
      const readNotifications = storedReadStatus ? JSON.parse(storedReadStatus) : {};

      const notificationsWithReadStatus = notifications.map(notification => ({
        ...notification,
        isRead: !!readNotifications[notification.notification_id]
      }));
      setData(notificationsWithReadStatus);
    } catch (error) {
      console.error("Error fetching notifications: ", error);
      Alert.alert("Error", "Failed to load notifications: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.email) {
      fetchNotifications();
    }
  }, [user?.email]);

  const markAsRead = async (notificationId) => {
    try {
      const updatedNotifications = data.map(notification =>
        notification.notification_id === notificationId ? { ...notification, isRead: true } : notification
      );
      setData(updatedNotifications);

      const readNotifications = await AsyncStorage.getItem('readNotifications');
      const updatedReadNotifications = readNotifications ? JSON.parse(readNotifications) : {};
      updatedReadNotifications[notificationId] = true;
      await AsyncStorage.setItem('readNotifications', JSON.stringify(updatedReadNotifications));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await deleteIndieNotificationInbox(user.email, notificationId, 24190, '7xmUkgEHBQtdSvSHDbZ9zd');
      const filteredNotifications = data.filter(notification => notification.notification_id !== notificationId);
      setData(filteredNotifications);

      const readNotifications = await AsyncStorage.getItem('readNotifications');
      const updatedReadNotifications = readNotifications ? JSON.parse(readNotifications) : {};
      delete updatedReadNotifications[notificationId];
      await AsyncStorage.setItem('readNotifications', JSON.stringify(updatedReadNotifications));

      Alert.alert("Success", "Notification deleted successfully.");
    } catch (error) {
      console.error("Error deleting notification:", error);
      Alert.alert("Error", "Failed to delete the notification.");
    }
  };

  const handlePressNotification = (notification) => {
    Alert.alert(
      "Notification Detail", 
      notification.message,
      [
        { text: "Close", onPress: () => markAsRead(notification.notification_id), style: "cancel" },
        { text: "Delete", onPress: () => deleteNotification(notification.notification_id) }
      ],
      { cancelable: false }
    );
  };

  return (
    <View style={styles.fullScreen}>
      <Image source={{ uri: 'https://i.imgur.com/Y6azwpB.png' }} style={styles.backgroundImage} />
      <ScrollView style={styles.scrollView}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : data.length > 0 ? (
          data.map((notification, index) => (
            <TouchableOpacity
              key={index}
              style={notification.isRead ? styles.notificationCard : styles.unreadNotificationCard}
              onPress={() => handlePressNotification(notification)}
            >
              <Text style={styles.title}>{notification.title}</Text>
              <Text style={styles.message}>{notification.message}</Text>
              <Text style={styles.date}>{notification.date}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.message}>No notifications found.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  notificationCard: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  unreadNotificationCard: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: '#e0f7fa', // Light blue background for unread notifications
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  message: {
    fontSize: 16,
  },
  date: {
    fontSize: 12,
    color: 'gray',
  },
});
