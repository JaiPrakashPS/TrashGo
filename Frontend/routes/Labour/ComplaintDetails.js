import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, Dimensions } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../api";
import MapView, { Marker } from 'react-native-maps';

export default function ComplaintDetails({ route, navigation }) {
  console.log("Received params:", route.params); // Debug log
  const { address, description, id, photoUrl, status, time, latitude, longitude } = route.params || {};
  const currentDate = new Date().toDateString(); // e.g., "Fri Apr 18 2025"
  const [labourId, setLabourId] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [isCollected, setIsCollected] = useState(status === "Collected");

  useEffect(() => {
    const getLabourId = async () => {
      const id = await AsyncStorage.getItem("labourId");
      setLabourId(id);
    };
    getLabourId();
  }, []);

  const handleCollected = async () => {
    if (!labourId) {
      Alert.alert("Error", "Labour ID not found. Please log in again.");
      return;
    }
    try {
      const response = await axios.patch(`${api}/api/labour/${labourId}`, {
        locationData: [{ status: "Collected" }],
      });
      console.log("Update response:", response.data); // Debug log for response
      Alert.alert("Success", "Complaint marked as Collected!");
      setIsCollected(true);
      navigation.goBack(); // Navigate back to ComplaintsPage
    } catch (error) {
      console.error("Error updating status:", error.message, error.response?.data);
      Alert.alert("Error", "Failed to mark complaint as Collected. Please check the server or endpoint. Error: " + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>COMPLAINT DETAILS</Text>
        <Text style={styles.dateText}>{currentDate}</Text>
      </View>

      {/* Card with Complaint Details */}
      <View style={styles.card}>
        <View style={styles.statusTimeContainer}>
          <Text style={styles.statusText}>Status: {status || "Pending"}</Text>
          <Text style={styles.timeText}>Time: {time || "Not Available"}</Text>
        </View>
        <Text style={styles.label}>COMPLAINT AREA ADDRESS:</Text>
        <Text style={styles.address}>{address || "No Address Provided"}</Text>
        <Text style={styles.label}>DESCRIPTION:</Text>
        <Text style={styles.description}>{description || "No Description Provided"}</Text>
      </View>

      {/* Photo */}
      {photoUrl && photoUrl.trim() !== "" ? (
        <Image source={{ uri: photoUrl }} style={styles.photo} />
      ) : (
        <Text style={styles.noPhotoText}>No Photo Available</Text>
      )}

      {/* Map View */}
      {showMap && latitude && longitude && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          <Marker
            coordinate={{ latitude: parseFloat(latitude), longitude: parseFloat(longitude) }}
            title={address || "Complaint Location"}
          >
            <Image
              source={require("../../assets/redustbin.png")}
              style={[
                styles.markerImage,
                isCollected && { width: 40, height: 40, tintColor: 'green' }
              ]}
            />
          </Marker>
        </MapView>
      )}

      {/* View Map Button */}
      <TouchableOpacity style={styles.mapButton} onPress={() => setShowMap(!showMap)}>
        <Text style={styles.buttonText}>VIEW THIS ADDRESS ON MAP</Text>
      </TouchableOpacity>

      {/* Collected Button */}
      <TouchableOpacity style={styles.taskButton} onPress={handleCollected} disabled={!labourId || isCollected}>
        <Text style={styles.taskText}>Collected</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FFF",
  },
  header: {
    backgroundColor: "#6BBE44",
    padding: 25,
    borderRadius: 5,
    marginVertical: 70,
    marginTop: -20,
    marginStart: -20,
    marginEnd: -20,
    marginBottom: 7,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 2,
  },
  dateText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTimeContainer: {
    marginBottom: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  timeText: {
    fontSize: 16,
    color: "#666",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    color: "#333",
  },
  address: {
    fontSize: 14,
    color: "#333",
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: "#333",
    marginBottom: 10,
  },
  photo: {
    width: "100%",
    height: 190,
    borderRadius: 10,
    marginBottom: 15,
  },
  noPhotoText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 15,
  },
  map: {
    width: "100%",
    height: 150,
    marginBottom: 10,
  },
  mapButton: {
    backgroundColor: "#6BBE44",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginBottom: 10,
  },
  taskButton: {
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
  },
  taskText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  markerImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
});