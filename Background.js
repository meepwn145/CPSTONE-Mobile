import React from 'react';
import {View, StyleSheet, ImageBackground} from 'react-native';

const Background = ({ children }) => {

    return (
        <View>
            <ImageBackground   source={{ uri: 'https://i.imgur.com/qw0lbQR.jpeg' }} style ={{height: '100%'}}/>
        <View>
            {children}
            </View>
        </View>
    )
}
export default Background;