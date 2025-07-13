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
import AsyncStorage from "@react-native-async-storage/async-storage";
import inchargerImg from "../../assets/incharger.jpg";
import { api } from "./appurl"; // Adjust the import path as necessary

const { width } = Dimensions.get("window");

export default function Inchargerlogin({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Backend authentication process (unchanged)
  const handleLogin = async () => {
    // Validate email and password fields
    if (!email || !password) {
      Alert.alert("Error", "Both fields are required");
      return;
    }

    try {
      // Making POST request to backend for login
      const response = await fetch(`${api}/api/auth/incharger/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }), // Sending email and password to the backend
      });

      // Parsing response from backend
      const data = await response.json();

      // Check if login is successful
      if (response.ok) {
        // Successful login, navigate to the InchargerDetails screen
        const { inchargerId } = data; // Assuming API returns inchargerId

        if (inchargerId) {
          // Store the inchargerId in AsyncStorage
          await AsyncStorage.setItem("inchargerId", inchargerId.toString());
        }
        Alert.alert("Success", "Login successful");
        navigation.navigate("InchargerHomePage");
      } else {
        // Show error message in case of failure
        Alert.alert("Error", data.error || "Login failed");
      }
    } catch (error) {
      // Handle any errors during the fetch request
      Alert.alert("Error", "Something went wrong");
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Image */}
      <Image source={inchargerImg} style={styles.image} />
      {/* Overlay for light green tint */}
      <View style={styles.overlay} />

      {/* Login Box */}
      <View style={styles.loginBox}>
        <Text style={styles.title}>YOU HAVE SELECTED INCHARGER</Text>
        <Text style={styles.subtitle}>LOGIN/SIGNUP</Text>

        {/* Email Input */}
        <TextInput
          style={styles.input}
          placeholder="ENTER YOUR EMAIL"
          placeholderTextColor="#000"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          accessible={true}
          accessibilityLabel="Email input"
          accessibilityHint="Enter your email address"
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
        <TouchableOpacity onPress={() => navigation.navigate("InchargerRegister")}>
          <Text style={styles.registerText}>
            Don’t have an account? <Text style={styles.registerLink}>Register now</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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