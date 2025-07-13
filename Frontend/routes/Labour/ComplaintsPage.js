import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Animated, Image, ActivityIndicator, Alert } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../api";

export default function ComplaintsPage({ navigation }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [noComplaints, setNoComplaints] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Fetch allocated complaints based on labourId
  useEffect(() => {
    fetchAllocatedComplaints();
  }, []);

  const fetchAllocatedComplaints = async () => {
    try {
      const labourId = await AsyncStorage.getItem("labourId");
      console.log("Labour ID:", labourId);
      if (!labourId) {
        console.warn("No labourId found in AsyncStorage");
        Alert.alert("Error", "No labourId found. Please log in again.");
        setLoading(false);
        return;
      }

      const response = await axios.get(`${api}/api/labour/${labourId}`);
      const data = response.data;
      console.log("Raw response data:", data);

      if (data && Array.isArray(data)) {
        const formattedComplaints = data.map(item => ({
          id: item._id || item.id,
          title: item.locationData[0]?.description || "No Title",
          address: item.locationData[0]?.userAddress || "No Address",
          description: item.locationData[0]?.description || "No Description",
          completed: item.locationData[0]?.status === "Collected",
          time: item.locationData[0]?.time || "Not Available",
          photoUrl: item.locationData[0]?.photoUrl || "",
          latitude: item.locationData[0]?.latitude || null,
          longitude: item.locationData[0]?.longitude || null,
        }));
        console.log("Formatted complaints with completed:", formattedComplaints);
        setComplaints(formattedComplaints);
        setNoComplaints(false);
      } else {
        setComplaints([]);
        setNoComplaints(true);
        console.log("No allocated complaints found or invalid data:", data);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        // Handle 404 error (no complaints allocated)
        setComplaints([]);
        setNoComplaints(true);
        console.log("No complaints allocated for this labour.");
      } else {
        // Handle other errors
        console.error("Error fetching allocated complaints:", error.message, error.response?.data);
        Alert.alert("Error", "Failed to fetch complaints. Please check your network or server.");
        setComplaints([]);
        setNoComplaints(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress
  useEffect(() => {
    const completedCount = complaints.filter(item => item.completed).length;
    const totalCount = complaints.length;
    const progressValue = totalCount > 0 ? completedCount / totalCount : 0;
    console.log("Progress calculation - completedCount:", completedCount, "totalCount:", totalCount, "progressValue:", progressValue);

    setProgress(progressValue);

    Animated.timing(progressAnim, {
      toValue: progressValue * 100,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [complaints]);

  const renderComplaintItem = ({ item }) => (
    <View style={styles.complaintBox}>
      <Text style={styles.complaintTitle}>{item.title}</Text>
      <View style={styles.row}>
        <Text style={[styles.statusText, { color: item.completed ? "green" : "red" }]}>
          {item.completed ? "✅ Collected" : "⏳ Pending"}
        </Text>
        <TouchableOpacity 
          style={styles.detailsButton} 
          onPress={() => {
            if (item && item.id) {
              console.log("Navigating with params:", {
                address: item.address,
                description: item.description,
                id: item.id,
                photoUrl: item.photoUrl,
                status: item.completed ? "Collected" : "Pending",
                time: item.time,
                latitude: item.latitude,
                longitude: item.longitude,
              });
              navigation.navigate("complaintdetails", { 
                address: item.address, 
                description: item.description,
                id: item.id,  
                photoUrl: item.photoUrl,
                status: item.completed ? "Collected" : "Pending",
                time: item.time,
                latitude: item.latitude,
                longitude: item.longitude,
              });
            } else {
              Alert.alert("Error", "Invalid complaint data.");
            }
          }}
        >
          <Text style={styles.detailsText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Refetch data when returning from ComplaintDetails
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log("Screen focused, triggering refetch");
      fetchAllocatedComplaints();
    });

    return unsubscribe;
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4682B4" />
        <Text style={styles.loadingText}>Loading complaints...</Text>
      </View>
    );
  }

  const currentDate = new Date().toDateString();

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Complaints</Text>
      </View>
      <Text style={styles.dateText}>{currentDate}</Text>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <Animated.View style={[styles.progressBarFill, { width: progressAnim.interpolate({
          inputRange: [0, 100],
          outputRange: ["0%", "100%"]
        }) }]} />
        <Animated.Image 
          source={require("../../assets/truck.png")}
          style={[
            styles.truckIcon,
            {
              left: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "90%"]
              })
            }
          ]}
        />
      </View>

      {/* Display message if no complaints */}
      {noComplaints ? (
        <View style={styles.noComplaintsContainer}>
          <Text style={styles.noComplaintsText}>No complaints allocated to you at the moment.</Text>
        </View>
      ) : (
        <FlatList 
          data={complaints} 
          keyExtractor={(item) => item.id} 
          renderItem={renderComplaintItem} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FFF",
  },
  headerContainer: {
    backgroundColor: "#6BBE44",
    paddingVertical: 30,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: "center",
    marginTop: -20,
    marginStart: -20,
    marginEnd: -20,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
  },
  dateText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  progressBarContainer: {
    height: 20,
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 20,
    position: "relative",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#6BBE44",
    position: "absolute",
    left: 0,
    top: 0,
  },
  truckIcon: {
    width: 30,
    height: 30,
    position: "absolute",
    top: -5,
  },
  complaintBox: {
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  complaintTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  detailsButton: {
    paddingVertical: 5,
  },
  detailsText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#007BFF",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#4682B4",
    textAlign: "center",
  },
  noComplaintsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noComplaintsText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
  },
});