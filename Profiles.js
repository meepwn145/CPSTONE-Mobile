import React, {useState, useEffect, useContext} from 'react';
import { StyleSheet, View, Text, Image, ScrollView, TouchableOpacity,TextInput, Alert } from 'react-native';
import { db, storage, auth} from "./config/firebase";
import { updateDoc, doc,getDoc, getDocs, query, where, collection } from 'firebase/firestore';
import UserContext from './UserContext';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const CustomCard = ({ children }) => {
  return (
    <View style={styles.cardContainer}>
      {children}
    </View>
  );
};


const Profs = () => {

  const { user } = useContext(UserContext);
  const [profileImageUrl, setProfileImageUrl] = useState("");
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [address, setAddress] = useState(user?.address ||'');
    const [phone, setPhone] = useState(user?.contactNumber||'');
    const [age, setAge] = useState(user?.age || '');
    const [gender, setGender] = useState(user?.gender || '');
    const [vehicle, setVehicle] = useState(user?.car||'');
    const [plateNumber, setPlateNumber] = useState(user?.carPlateNumber || '');
    const [editingField, setEditingField] = useState(null);
    const [managementNames, setManagementNames] = useState([]);
    const [image, setImage] = useState(null)
   const [uploading, setUploading] = useState(false) 

    

    useEffect(() => {
      const fetchUserData = async () => {
        try {
          if (auth.currentUser) {
            const userId = auth.currentUser.uid;
            const userDocRef = doc(db, 'user', userId);
            const userDocSnapshot = await getDoc(userDocRef);
  
            if (userDocSnapshot.exists()) {
              const userData = userDocSnapshot.data();
              setName(userData.name || "");
              setAddress(userData.address || "");
              setEmail (userData.email || "");
              setPhone(userData.contactNumber || "");
              setAge(userData.age || "");
              setGender(userData.gender || "");
              setVehicle(userData.car || "");
              setPlateNumber(userData.carPlateNumber || "");
            } else {
              console.log("No user data found!");
            }
          }
        } catch (error) {
          console.error("Error fetching user data: ", error);
        }
      };
  
      fetchUserData();
    }, [user]);
    const formatDate = (timestamp) => {
      if (timestamp && timestamp.toDate) {
        return timestamp.toDate().toLocaleString(); 
      }
      return '';
    };

    const updateUserData = async () => {
      try {
        if (auth.currentUser) {
          const userId = auth.currentUser.uid;
          const userDocRef = doc(db, 'user', userId);
          const updatedData = {
            name: name,
            address: address,
            contactNumber: phone,
            age: age,
            gender: gender,
            car: vehicle,
            carPlateNumber: plateNumber,
          };
          await updateDoc(userDocRef, updatedData);
          console.log("User data updated/created successfully!");
        } else {
          console.error("User not authenticated");
        }
      } catch (error) {
        console.error("Error updating user data: ", error);
      }
    };

    const handleUpdate = async () => {
     
      await updateUserData();
 
      setEditingField(null);
    };
  
    const renderEditableView = (field, value, setValue) => {
      return editingField === field ? (
        <TextInput
          value={value}
          onChangeText={setValue}
          style={styles.editableText}
          onBlur={handleUpdate}
        />
      ) : (
        <Text style={styles.itemSubtitle} onPress={() => setEditingField(field)}>
          {value}
        </Text>
      );
    };
    useEffect(() => {
      let isMounted = true;
    
      const fetchManagementNames = async () => {
        if (!auth.currentUser) {
          console.log("User not authenticated.");
          return;
        }
    
        const userEmail = auth.currentUser.email;
        console.log("Fetching management names for user email:", userEmail);
    
        try {
          const logsQuery = query(collection(db, 'logs'), where('email', '==', userEmail));
          const querySnapshot = await getDocs(logsQuery);
    
          if (querySnapshot.empty) {
            console.log("No matching documents found.");
            return;
          }
    
          const fetchedManagementNames = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              name: data.managementName,
              time: formatDate(data.timeIn)
            };
          });
    
          if (isMounted) {
            setManagementNames(fetchedManagementNames);
          }
        } catch (error) {
          console.error("Error fetching management names: ", error);
        }
      };
    
      fetchManagementNames();
    
      return () => {
        isMounted = false;
      };
    }, [user?.email]);
    
    useEffect(() => {
      (async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need camera roll permissions to make this work!');
        }
      })();
    }, []);
    
    const uploadImage = async () => {
      try {
        if (!image || !image.uri) {
          throw new Error("Image URI is undefined");
        }
    
        const response = await fetch(image.uri);
    
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
    
        const blob = await response.blob();
        const filename = image.uri.substring(image.uri.lastIndexOf('/') + 1);
        const storageRef = ref(storage, `profilePictures/${filename}`);
        await uploadBytes(storageRef, blob);
    
        const downloadURL = await getDownloadURL(storageRef);
        setProfileImageUrl(downloadURL);

        if (auth.currentUser) {
          const userId = auth.currentUser.uid;
          const userDocRef = doc(db, 'user', userId);
          await updateDoc(userDocRef, { profileImageUrl: downloadURL });
        }
    
        setUploading(false);
        Alert.alert('Photo uploaded!');
        setImage(null);
      } catch (error) {
        console.error(error);
        setUploading(false);
      }
    };
    
    useEffect(() => {
      const fetchProfileImage = async () => {
        if (auth.currentUser) {
          const userId = auth.currentUser.uid;
          const userDocRef = doc(db, 'user', userId);
          const userDocSnapshot = await getDoc(userDocRef);
    
          if (userDocSnapshot.exists()) {
            const userData = userDocSnapshot.data();
            if (userData.profileImageUrl) {
              setProfileImageUrl(userData.profileImageUrl);
            }
          } else {
            console.log("No user profile found!");
          }
        }
      };
    
      fetchProfileImage();
    }, []);
    

    const pickImage = async () => {
      let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          allowsEditing: true,
          aspect: [4,3],
          quality: 1
      });
      const source = {uri: result.assets[0].uri}
      console.log(source)
      setImage(source)
  }; 

  return (
    <ScrollView style={styles.container}>
        <View style={styles.container}>
          
      <Image
       source={{ uri: 'https://i.imgur.com/zWpTvRv.png' }}
      style={styles.backgroundImage}
    />
    <View style={styles.section}>
  <CustomCard>
      <View style={styles.header}>
    {profileImageUrl && (
      <Image source={{ uri: profileImageUrl }} style={[styles.profileImage, styles.circularImage]} />
    )}
    {image && <Image source={{ uri: image.uri }} style={[styles.image, styles.circularImage]} />}

   
  </View>

  </CustomCard>
  <Text style={styles.name}>{name}</Text>
  <Text style={styles.occupation}>{email}</Text>
  <View style={styles.buttonContainer}>
      <TouchableOpacity onPress={pickImage} style={[styles.button, { borderColor: '#87CEEB' }]}>
        <Text style={[styles.buttonText, { color: '#87CEEB' }]}>Pick Image</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={uploadImage} style={[styles.button2, { borderColor: '#87CEEB' }]}>
        <Text style={styles.buttonText}>Upload Image</Text>
      </TouchableOpacity>
    </View>

        <View style={styles.subSection}>
        <Text style={styles.subHeader}>Basic Information</Text>
          <View style={styles.itemContainer}>
            <View style={styles.itemTextContainer}>
            <Text style={styles.itemTitle}>Name</Text>
            {renderEditableView('name', name, setName)}
            <Text style={styles.itemTitle}>Address</Text>
            {renderEditableView('address', address, setAddress)}
            <Text style={styles.itemTitle}>Age</Text>
              {renderEditableView('age', age, setAge)}
              <Text style={styles.itemTitle}>Gender </Text>
              {renderEditableView('gender', gender, setGender)}
            </View>
            <TouchableOpacity onPress={() => setEditingField('address')}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
             </View>
             <View style={styles.divider}></View>
             <Text style={styles.subHeader}>Contact Information</Text>
          <View style={styles.itemContainer}>
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemTitle}>Phone Number</Text>
              {renderEditableView('phoneNumber', phone, setPhone)}
              <Text style={styles.itemTitle}>Email</Text>
              <Text style={styles.itemSubtitle}>{email}</Text>
            </View>
            <TouchableOpacity onPress={() => {  }}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
             </View>
             <View style={styles.divider}></View>
             <Text style={styles.subHeader}>Other Information</Text>
          <View style={styles.itemContainer}>
            <View style={styles.itemTextContainer}>
            <Text style={styles.itemTitle}>Vehicle </Text>
            {renderEditableView('vehicle', vehicle, setVehicle)}
            <Text style={styles.itemTitle}>Vehicle Plate Number </Text>
            {renderEditableView('carPlateNumber', plateNumber, setPlateNumber)}
            </View>
            <TouchableOpacity onPress={() => {  }}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
             </View>
             <View style={styles.divider}></View>
             <Text style={styles.sectionTitle}>Recent Parking History</Text>
              <View style={styles.managementContainer}>
              {managementNames.length > 0 ? (
              managementNames.map((item, index) => (
                <Text key={index} style={styles.skill}>{item.name} - {item.time}</Text>
              ))
            ) : (
              <Text>No management names found</Text>
            )}
        </View>
      </View>
      </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
    color: 'black',
    alignSelf: 'center',
  },
  occupation: {
    fontSize: 16,
    color: '#666',
    alignSelf: 'center',
  },
  address: {
    fontSize: 16,
    color: '#666',
    alignSelf: 'center',
  },
  section: {
    padding: 20,
    borderBottomColor: '#D3D3D3',
    marginTop: '20%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  item: {
    marginTop: 10,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemContent: {
    fontSize: 16,
    color: '#666',
  },
  managementContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skill: {
    margin: 4,
    backgroundColor: '#20B2AA', 
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionContainer: {
    backgroundColor: '#F7F7F7',
    padding: 16,
  },
  sectionHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#CDCDCD',
    paddingBottom: 4,
    marginBottom: 16,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  subSection: {
    marginBottom: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTextContainer: {
    flex: 1,
  },
  subHeader: {
    marginTop: '5%',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  itemTitle: {
    fontSize: 14,
    color: 'black',
    fontWeight: 'bold'
  },

  itemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  editText: {
    fontSize: 14,
    color: '#1E90FF',
  },
  divider: {
    height: 1,
    backgroundColor: '#FFD700',
    marginTop: 16, 
    marginBottom: 16, 
  },
  editableText: {
    backgroundColor: '#e8f0fe', 
    borderColor: '#4a90e2', 
    borderWidth: 1,
    borderRadius: 4,
    padding: 5,
  },
  buttonContainer: {
    flexDirection: 'row', 
    marginTop: 10,
    alignSelf: 'center',
  },
  button2: {
    backgroundColor: '#39e75f',
    paddingVertical: 8,
    borderRadius: 100,
    width: '40%',
    height: 40,
    alignItems: 'center',
    marginLeft: '5%',
    alignSelf: 'center',
  },
  button: {
    backgroundColor: 'white',
    justifyContent: 'center',
    borderRadius: 100,
    paddingVertical: 5,
    alignItems: 'center',
    borderWidth: 2,
    width: '40%',
    height: 40,
    alignContent: 'center',
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Courier New',
    
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '55%',
    resizeMode: 'cover',
  },
  circularContainer: {
    alignItems: 'center', // Center the image within the container
  },
  profileImage: {
    // Your existing styles for the profile image
    width: 200, 
    height: 170,
  },
  image: {
    // Your existing styles for other images
    width: '129%', // Adjust the width to fill the circle
    height: '121%', // Adjust the height to fill the circle
    borderRadius: '0%',
    marginTop: -19, // Apply a border radius to make it circular
  },
  circularImage: {
    // Apply circular border radius to images
    borderRadius: 150, // Half of your desired width or height for a perfect circle
    overflow: 'hidden', // To ensure the content doesn't overflow the circular container
  },
  cardContainer: {
    borderColor: 'white',
    alignSelf: 'center',
    borderRadius: 200, // Half of the desired width or height for a perfect circle
    borderWidth: 2,
    marginHorizontal: 10,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    width: '50%', // Adjust the width as needed
    aspectRatio: 1, // Ensure the aspect ratio remains 1:1 for a perfect circle
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },
});

export default Profs;
