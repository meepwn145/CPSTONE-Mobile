import { Store, registerInDevtools } from "pullstate";
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './config/firebase';

export const LocationStore = new Store({
    lat: 10.1735,
    lng: 123.5407,
});

export const ReservationStore = new Store({
	status: "Inactive",
	reservationId: "",
	managementName: "",
	parkingPay: "",
	floorTitle: "",  
    slotNumber: ""  
});



registerInDevtools({ LocationStore });
