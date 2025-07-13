import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { Picker } from "@react-native-picker/picker";
import styles from "./UserDetailsStyle";
import api from "../../api";

const UserDetails = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [initialCoords, setInitialCoords] = useState(null);
  const [originalUserData, setOriginalUserData] = useState(null);

  const [userData, setUserData] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
    address: "",
    office: "",
    area: "",
    street: "",
    location: {
      type: "Point",
      coordinates: [0, 0],
    },
  });

  const [availableAreas, setAvailableAreas] = useState([]);
  const [availableStreets, setAvailableStreets] = useState([]);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    setLoading(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Location permission is required.");
      setLoading(false);
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    setInitialCoords({ latitude, longitude });
    updateLocation(latitude, longitude);
    setLoading(false);
  };

  const updateLocation = async (latitude, longitude) => {
    const updatedData = {
      ...userData,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
    };

    try {
      const address = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (address?.[0]?.street) {
        updatedData.address = address[0].street;
      }
    } catch (error) {
      console.warn("Reverse geocoding failed:", error);
    }

    setUserData(updatedData);
    if (!originalUserData) {
      setOriginalUserData(updatedData);
    }
  };

  const handleMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    updateLocation(latitude, longitude);
  };

  const fetchDynamicAreas = async (selectedOffice) => {
    try {
      const response = await fetch(`${api}/api/inchargerDetails/byOfficeAndArea?office=${selectedOffice}`);
      const data = await response.json();
      setAvailableAreas(data.supervisingAreas || []);
    } catch (error) {
      console.error("Error fetching areas:", error);
      setAvailableAreas([]);
    }
  };

  const fetchDynamicStreets = async (office, selectedArea) => {
    try {
      const response = await fetch(`${api}/api/inchargerDetails/byOfficeAndArea?office=${office}&area=${selectedArea}`);
      const data = await response.json();
      setAvailableStreets(data.streetNames || []);
    } catch (error) {
      console.error("Error fetching streets:", error);
      setAvailableStreets([]);
    }
  };

  const handleChange = (field, value) => {
    if (field === "office") {
      setUserData((prev) => ({
        ...prev,
        office: value,
        area: "",
        street: "",
      }));
      fetchDynamicAreas(value);
      setAvailableStreets([]);
    } else if (field === "area") {
      setUserData((prev) => ({
        ...prev,
        area: value,
        street: "",
      }));
      fetchDynamicStreets(userData.office, value);
    } else {
      setUserData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleReset = () => {
    if (initialCoords) {
      updateLocation(initialCoords.latitude, initialCoords.longitude);
    }
  };
  const handleSubmit = async () => {
    const {
      name,
      email,
      password,
      phoneNumber,
      address,
      office,
      area,
      street,
      location: { coordinates },
    } = userData;
  
    if (!name || !email || !password || !phoneNumber || !address || !office || !area || !street) {
      Alert.alert("Incomplete", "Please fill all required fields.");
      return;
    }
  
    if (originalUserData && JSON.stringify(userData) === JSON.stringify(originalUserData)) {
      Alert.alert("No Changes", "You haven't made any changes.");
      return;
    }
  
    try {
      const response = await fetch(`${api}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          phoneNumber,
          address,
          office,
          area,
          street,
          longitude: coordinates[0],
          latitude: coordinates[1],
          inchargerId: "67f7898d187d8bc1afd5ce38", // Hardcode or fetch dynamically
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        Alert.alert("Registration Failed", data.message || "Unknown error");
      } else {
        Alert.alert("✅ Registered Successfully", "Redirecting to login...", [
          {
            text: "OK",
            onPress: () => navigation.navigate("userlogin"),
          },
        ]);
      }
    } catch (error) {
      console.error("Registration Error:", error);
      Alert.alert("❌ Error", "Something went wrong. Please try again.");
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

      <TextInput style={styles.input} placeholder="Name" value={userData.name} onChangeText={(text) => handleChange("name", text)} />
      <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" value={userData.email} onChangeText={(text) => handleChange("email", text)} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={userData.password} onChangeText={(text) => handleChange("password", text)} />
      <TextInput style={styles.input} placeholder="Phone Number" keyboardType="phone-pad" value={userData.phoneNumber} onChangeText={(text) => handleChange("phoneNumber", text)} />
      <TextInput style={styles.input} placeholder="Address" value={userData.address} onChangeText={(text) => handleChange("address", text)} />

      {/* Office Picker */}
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Select Your Office</Text>
        <Picker selectedValue={userData.office} onValueChange={(value) => handleChange("office", value)} style={styles.picker}>
          <Picker.Item label="Select Your Region" value="" color="gray" />
          <Picker.Item label="Corporation" value="Corporation" />
          <Picker.Item label="Village Panchayat" value="Village Panchayat" />
          <Picker.Item label="Town Panchayat" value="Town Panchayat" />
          <Picker.Item label="City" value="City" />
        </Picker>
      </View>

      {/* Area Picker */}
      {userData.office ? (
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Select Area</Text>
          <Picker selectedValue={userData.area} onValueChange={(value) => handleChange("area", value)} style={styles.picker}>
            <Picker.Item label="Select Area" value="" color="gray" />
            {availableAreas.map((area) => (
              <Picker.Item key={area} label={area} value={area} />
            ))}
          </Picker>
        </View>
      ) : null}

      {/* Street Picker */}
      {userData.office && userData.area ? (
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Select Street</Text>
          <Picker selectedValue={userData.street} onValueChange={(value) => handleChange("street", value)} style={styles.picker}>
            <Picker.Item label="Select Street" value="" color="gray" />
            {availableStreets.map((street) => (
              <Picker.Item key={street} label={street} value={street} />
            ))}
          </Picker>
        </View>
      ) : null}

      {/* Coordinates + Reset */}
      <View style={styles.coordRow}>
        <View style={styles.coordCol}>
          <Text style={styles.coordText}>📍 Latitude: {userData.location.coordinates[1]}</Text>
          <Text style={styles.coordText}>📍 Longitude: {userData.location.coordinates[0]}</Text>
        </View>
        <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      <TouchableOpacity style={styles.showMapButton} onPress={() => setShowMap((prev) => !prev)}>
        <Text style={styles.buttonText}>{showMap ? "Hide Map" : "Show Map"}</Text>
      </TouchableOpacity>

      {showMap && (
        <MapView
          style={styles.map}
          onPress={handleMapPress}
          region={{
            latitude: userData.location.coordinates[1],
            longitude: userData.location.coordinates[0],
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{
              latitude: userData.location.coordinates[1],
              longitude: userData.location.coordinates[0],
            }}
            draggable
            onDragEnd={handleMapPress}
            title="Selected Location"
          />
        </MapView>
      )}

      {/* Submit */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.buttonText}>SUBMIT</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default UserDetails;