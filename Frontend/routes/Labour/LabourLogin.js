import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../api";
import labourLoginImg from "../../assets/labourlogin.jpeg";

const { width } = Dimensions.get("window");

const LabourLogin = () => {
  const navigation = useNavigation();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");

  // Backend authentication process (unchanged)
  const handleLogin = async () => {
    if (!phoneNumber || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    try {
      const response = await axios.post(`${api}/api/labour/login`, {
        phoneNumber,
        password,
      });

      if (response.status === 200) {
        const { labourId, labourDetails } = response.data;
        Alert.alert("Success", "Login successful");
        await AsyncStorage.setItem("labourId", labourId);
        console.log("Labour ID:", labourId);

        // Navigate to next screen and pass labour details
        navigation.navigate("labourhome", { labourId, labourDetails });
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        Alert.alert("Login Failed", err.response.data.error);
      } else {
        Alert.alert("Error", "Something went wrong");
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Image */}
      <Image source={labourLoginImg} style={styles.image} />
      {/* Overlay for light green tint */}
      <View style={styles.overlay} />

      {/* Login Box */}
      <View style={styles.loginBox}>
        <Text style={styles.title}>YOU HAVE SELECTED LABOUR</Text>
        <Text style={styles.subtitle}>LOGIN/SIGNUP</Text>

        {/* Phone Number Input */}
        <TextInput
          style={styles.input}
          placeholder="ENTER YOUR PHONE NUMBER"
          placeholderTextColor="#000"
          keyboardType="numeric"
          maxLength={10}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          accessible={true}
          accessibilityLabel="Phone number input"
          accessibilityHint="Enter your 10-digit phone number"
        />

        {/* Password Input */}
        <TextInput
          style={styles.input}
          placeholder="ENTER YOUR PASSWORD"
          placeholderTextColor="#000"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          accessible={true}
          accessibilityLabel="Password input"
          accessibilityHint="Enter your password"
        />

        {/* Login Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          accessible={true}
          accessibilityLabel="Login button"
          accessibilityHint="Press to log in with your credentials"
        >
          <Text style={styles.buttonText}>LOGIN</Text>
        </TouchableOpacity>

        {/* Register Link */}
        <TouchableOpacity onPress={() => navigation.navigate("labourregister")}>
          <Text style={styles.registerText}>
            Don’t have an account? <Text style={styles.registerLink}>Register now</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  image: {
    width: "100%",
    height: "60%",
    resizeMode: "cover",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(107, 190, 68, 0.1)", // Light green tint
    height: "60%",
  },
  loginBox: {
    width: width * 0.9,
    backgroundColor: Platform.select({
      ios: "rgba(255, 255, 255, 0.95)",
      android: "#FFFFFF",
    }),
    padding: 24,
    borderRadius: 24,
    alignSelf: "center",
    position: "absolute",
    top: "45%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: Platform.select({
      ios: 0,
      android: 1,
    }),
    borderColor: "rgba(107, 190, 68, 0.2)",
  },
  title: {
    fontSize: 24,
    fontFamily: "LuckiestGuy",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6BBE44",
    marginBottom: 24,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: "500",
  },
  input: {
    width: "100%",
    backgroundColor: "#F7F9FC",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    fontSize: 16,
    color: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#E5E9F0",
    marginBottom: 16, // Added gap between input fields
  },
  button: {
    width: "100%",
    backgroundColor: "#6BBE44",
    padding: 18,
    borderRadius: 16,
    marginTop: 24,
    shadowColor: "#6BBE44",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 1,
  },
  registerContainer: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerText: {
    fontSize: 15,
    color: "#666666",
    textAlign: "center",
  },
  registerLink: {
    color: "#6BBE44",
    fontWeight: "600",
    marginLeft: 4,
  },
});

export default LabourLogin;