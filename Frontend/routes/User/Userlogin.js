import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from "react-native";
import axios from "axios";
import styles from "./Userloginstyle";
import userLoginImg from "../../assets/userlogin.png";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../api";

export default function Userlogin({ navigation }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!phoneNumber || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!/^\d{10}$/.test(phoneNumber)) {
      Alert.alert("Error", "Invalid phone number! Must be exactly 10 digits.");
      return;
    }

    try {
      console.log("Raw phoneNumber:", phoneNumber, "Raw password:", password); // Debug raw input
      const response = await axios.post(`${api}/api/auth/login`, {
        phoneNumber,
        password,
      });

      console.log("Login response:", response.data);

      if (response.status === 200 && response.data.message === "✅ Login successful") {
        const { userId, street, inchargerId, name, phoneNumber: userPhone } = response.data.user;

        if (!userId || !street || !inchargerId) {
          throw new Error("Missing required user data in response");
        }

        await AsyncStorage.setItem("userId", userId);
        await AsyncStorage.setItem("userStreet", street);
        await AsyncStorage.setItem("userInchargerId", inchargerId || "");
        await AsyncStorage.setItem("userName", name || "Unknown User");
        await AsyncStorage.setItem("userPhone", userPhone || "");

        await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
        console.log("📦 Stored in AsyncStorage:", { userId, userStreet: street, userInchargerId: inchargerId });

        Alert.alert("Success", "Login successful!", [
          { text: "OK", onPress: () => navigation.navigate("userhomepage") },
        ]);
      } else {
        Alert.alert("Login Failed", response.data.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error.response?.data || error);
      Alert.alert(
        "Error",
        error.response?.data?.message || error.message || "Something went wrong. Please try again later."
      );
    }
  };

  return (
    <View style={styles.container}>
      <Image source={userLoginImg} style={styles.image} />

      <View style={styles.loginBox}>
        <Text style={styles.title}>YOU HAVE SELECTED USER</Text>
        <Text style={styles.subtitle}>LOGIN/SIGNUP</Text>

        <TextInput
          style={styles.input}
          placeholder="ENTER YOUR PHONE NUMBER"
          placeholderTextColor="#000"
          keyboardType="numeric"
          maxLength={10}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />

        <TextInput
          style={styles.input}
          placeholder="ENTER YOUR PASSWORD"
          placeholderTextColor="#000"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>LOGIN</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("userdetails")}>
          <Text style={styles.registerText}>
            Don’t have an account? <Text style={styles.registerLink}>Register now</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}