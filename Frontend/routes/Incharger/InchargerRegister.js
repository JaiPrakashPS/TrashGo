
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import styles from "./InchargerRegisterStyle";
import inchargerregister from "../../assets/incharger.jpg";
import { api } from "./appurl"; // Adjust the import path as necessary

const UserRegister = ({ navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "All fields are required");
      return;
    }
    
    try {
      const response = await fetch(`${api}/api/auth/incharger/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      console.log(data);

      if (response.ok) {
        Alert.alert("Success", "Registration successful");
        navigation.navigate("Inchargerlogin");
      } else {
        Alert.alert("Error", data.message || "Registration failed");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong");
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={inchargerregister} style={styles.image} />
      <View style={styles.formContainer}>
        <Text style={styles.title}>REGISTER</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Enter Your Name"
          placeholderTextColor="#000"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Enter Your Email/Phone Number"
          placeholderTextColor="#000"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Enter Your Password"
          placeholderTextColor="#000"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>REGISTER AS INCHARGER</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default UserRegister;
