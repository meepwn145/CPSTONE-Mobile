import { getUnreadIndieNotificationInboxCount } from 'native-notify';

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