import React from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StatusBar } from "react-native";
import { useNavigation } from "@react-navigation/native";
import styles from "./UserRegisterStyle";
import userlogin from "../../assets/userlogin.png";

const UserRegister = ({navigation}) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Image source={userlogin} style={styles.image} />
      <View style={styles.overlay} />
      
      <View style={styles.formContainer}>
        <Text style={styles.title}>CREATE ACCOUNT</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Enter your full name" 
            placeholderTextColor="#666666"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Enter your phone number" 
            placeholderTextColor="#666666"
            keyboardType="numeric"
            maxLength={10}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Create a password" 
            placeholderTextColor="#666666" 
            secureTextEntry 
          />
        </View>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate("userdetails")}
        >
          <Text style={styles.buttonText}>CREATE ACCOUNT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default UserRegister;
