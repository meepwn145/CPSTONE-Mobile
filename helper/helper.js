import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  doc,
} from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Fetch real-time data from Firestore.
 * @param {Object} params - Parameters for the query.
 * @param {string} params.collectionName - Name of the Firestore collection.
 * @param {Array} params.conditions - Array of conditions for the query (e.g., [["field", "==", value]]).
 * @param {Function} callback - Function to handle the data or errors (called with { data, error }).
 * @returns {Function} Unsubscribe function to stop listening.
 */
export const fetchData = ({ collectionName, conditions }, callback) => {
  const collectionRef = collection(db, collectionName);

  const queryConditions = conditions.map(([field, operator, value]) =>
    where(field, operator, value)
  );
  const q = query(collectionRef, ...queryConditions);

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      if (querySnapshot.empty) {
        // callback({ data: null, error: "No data found." });
        return;
      }

      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback({ data, error: null });
    },
    (error) => {
      callback({ data: null, error });
    }
  );

  return unsubscribe;
};

/**
 * Fetch data once (non-real-time) from Firestore.
 * @param {Object} params - Parameters for the query.
 * @param {string} params.collectionName - Name of the Firestore collection.
 * @param {Array} params.conditions - Array of conditions for the query (e.g., [["field", "==", value]]).
 * @returns {Promise} Resolves with { data, error }.
 */
export const fetchReservation = ({ collectionName, conditions }, callback) => {
  const collectionRef = collection(db, collectionName);

  const queryConditions = conditions.map(([field, operator, value]) =>
    where(field, operator, value)
  );
  const q = query(collectionRef, ...queryConditions);

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      if (querySnapshot.empty) {
        // callback({ data: null, error: "No data found." });
        return;
      }

      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback({ data, error: null });
    },
    (error) => {
      callback({ data: null, error });
    }
  );

  return unsubscribe;
};

// Fetch inside a document

export const fetchSlotData = (
  { parentCollection, documentId, subCollection, reservationId },
  callback
) => {
  try {
    // Reference to the 'slot' collection
    const parentRef = collection(db, parentCollection);

    // Reference to the 'Gilbert Canete Parking Management' document inside 'slot'
    const documentRef = doc(parentRef, documentId);

    // Reference to the 'slotData' subcollection inside the document
    const subCollectionRef = collection(documentRef, subCollection);

    // Optionally, use query to filter documents (if reservationId is provided)
    const q = reservationId
      ? query(subCollectionRef, where("reservationId", "==", reservationId)) // Filter by reservationId
      : subCollectionRef;

    // Get documents from the subcollection
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        if (querySnapshot.empty) {
          callback({ data: null, error: "No data found." });
          return;
        }

        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        callback({ data, error: null }); // Pass data to callback
      },
      (error) => {
        callback({ data: null, error: "Error fetching data." });
      }
    );

    return unsubscribe; // Return unsubscribe function to stop listening
  } catch (error) {
    console.error("Error fetching slot data:", error);
    callback({ data: null, error: "Error fetching data." });
  }
};
