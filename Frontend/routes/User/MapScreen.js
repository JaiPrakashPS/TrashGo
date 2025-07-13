import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from "react-native";
import Geolocation from "react-native-geolocation-service";
import { Picker } from "@react-native-picker/picker";
import styles from "./UserDetailsStyle";
import api from "../../api";
import axios from "axios";

const defaultAreas = ["Kinathukadavu", "Palladam", "Kovai", "Pollachi"];

const UserDetails = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
    address: "",
    area: defaultAreas[0],
    location: {
      type: "Point",
      coordinates: [0, 0],
    },
  });

  useEffect(() => {
    const requestLocationPermission = async () => {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "This app needs access to your location.",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    };

    const getLocation = async () => {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert("❌ Permission Denied", "Location permission is required.");
        setLoading(false);
        return;
      }

      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserData((prev) => ({
            ...prev,
            location: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
          }));
          setLoading(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          Alert.alert("❌ Location Error", error.message || "Failed to get location");
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 1000,
        }
      );
    };

    getLocation();
  }, []);

  const handleChange = (field, value) => {
    setUserData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    const {
      name,
      email,
      password,
      phoneNumber,
      address,
      area,
      location: { coordinates },
    } = userData;

    if (!name || !email || !password || !phoneNumber || !address || !area) {
      Alert.alert("⚠️ Incomplete", "Please fill all required fields.");
      return;
    }

    const payload = {
      name,
      email,
      password,
      phoneNumber,
      address,
      area,
      longitude: coordinates[0],
      latitude: coordinates[1],
    };

    try {
      const res = await axios.post(`${api}/api/auth/register`, payload);
      if (res.status === 201) {
        Alert.alert("✅ Registered", "User registered successfully.");
        navigation.navigate("userhomepage");
      } else {
        Alert.alert("❌ Error", "Registration failed.");
      }
    } catch (err) {
      console.error("Registration Error:", err);
      Alert.alert("❌ Error", err.response?.data?.message || "Server error");
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.headerText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.headerText}>REGISTER USER DETAILS</Text>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={userData.name}
        onChangeText={(text) => handleChange("name", text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        value={userData.email}
        onChangeText={(text) => handleChange("email", text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={userData.password}
        onChangeText={(text) => handleChange("password", text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        keyboardType="phone-pad"
        value={userData.phoneNumber}
        onChangeText={(text) => handleChange("phoneNumber", text)}
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Address"
        multiline
        value={userData.address}
        onChangeText={(text) => handleChange("address", text)}
      />

      <View style={{ width: "100%", marginBottom: 10 }}>
        <Text style={{ fontWeight: "bold", marginBottom: 5 }}>Select Area</Text>
        <Picker
          selectedValue={userData.area}
          onValueChange={(itemValue) => handleChange("area", itemValue)}
          style={{
            height: 50,
            borderWidth: 1,
            borderColor: "#000",
            backgroundColor: "#eee",
          }}
        >
          {defaultAreas.map((area) => (
            <Picker.Item key={area} label={area} value={area} />
          ))}
        </Picker>
      </View>

      <Text style={styles.coordText}>
        📍 Latitude: {userData.location.coordinates[1]}
      </Text>
      <Text style={styles.coordText}>
        📍 Longitude: {userData.location.coordinates[0]}
      </Text>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.buttonText}>SUBMIT</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default UserDetails;
