const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendPushNotification = functions.firestore
  .document('reservations/{reservationId}')
  .onCreate(async (snapshot, context) => {
    const reservationData = snapshot.data();

    // Get the user associated with the reservation
    const userRef = admin.firestore().doc(`users/${reservationData.userEmail}`);
    const userSnap = await userRef.get();
    const user = userSnap.data();

    // Check if the user has a token
    if (user.expoPushToken) {
      const message = {
        to: user.expoPushToken,
        sound: 'default',
        title: 'New Reservation',
        body: `Your reservation for slot ${reservationData.slotId} is confirmed!`,
        data: { reservationData },
      };

      // Use fetch to send the notification
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      return response.json();
    } else {
      console.log('No token for user, cannot send notification');
    }
  });
