import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {db} from "./config/firebase";
import { collection, query, where, getDocs } from 'firebase/firestore';



export default function Search() {
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'establishments'));
        const querySnapshot = await getDocs(q);
        const fetchedData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAllData(fetchedData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data: ", error);
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);

  const handleSearch = (text) => {
    setSearchText(text);
    const filteredItems = allData.filter((item) =>
      (item.companyAddress?.toLowerCase() || "" ).includes(text.toLowerCase())
    );
    setFilteredData(filteredItems);
  };
  

  const handleItemClick = (item) => {
    navigation.navigate('Details', { item });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleItemClick(item)}>
      <View style={styles.item}>
      <Image  source={item.profileImageUrl ? { uri: item.profileImageUrl } : require("./images/SPOTWISE.png")} style={styles.itemImage} />
        <View style={{flex:1}}>
        <Text style={styles.itemName}>{item.companyAddress}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (

  

    <View style={styles.container}>
      
      <Image
        source={{ uri: 'https://i.imgur.com/WwPGlNh.png' }}
      style={styles.backgroundImage}
    />
    <Image
      source={{ uri: 'https://i.imgur.com/Tap1nZy.png' }}
      style={[styles.backgroundImage, { borderTopLeftRadius: 75, borderTopRightRadius: 75, marginTop: 100}]}
    />
    <Text style={{marginTop: 6, marginLeft: '30%', fontSize: 50, fontWeight: 'bold', color: 'white', marginVertical: 10}}>Search</Text>
    <View style={styles.formContainer}>
 
      <View style={styles.searchContainerStyle}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          onChangeText={handleSearch}
          value={searchText}
          placeholderTextColor="black"
        />
      </View>
      <Text style={styles.search}></Text>
      <FlatList
  data={filteredData}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  ListEmptyComponent={() => (
    <View style={styles.emptyListComponent}>
      <Text style={styles.emptyListText}>No results found</Text>
    </View>
  )}
/>
      
    </View>
    
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  search: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 50,
    textAlign: 'center',
  },
  searchInput: {
    marginTop: 100,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 10,
    color: 'black',

  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
    borderRadius: 100,
  },
  itemImage: {
    width: 40,
    height: 40,
    marginRight: 10,
    resizeMode: 'cover',
  },
  itemName: {
    fontSize: 16,
  },
  searchContainerStyle: {
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginTop: 20,
    paddingHorizontal: '10%',
    marginBottom: 20,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject, 
    width: '100%',
    height: '100%',
    resizeMode: 'cover' 
  },
  emptyListComponent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: 16,
    color: 'gray',
  },
});