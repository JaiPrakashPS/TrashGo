import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import MapView, { Marker } from "react-native-maps";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../api";

// Utility function to fetch complaint details
const fetchComplaintDetails = async (complaintId, baseUrl) => {
  try {
    const response = await axios.get(`${baseUrl}/api/complaints/${complaintId}`);
    console.log("Fetched Complaint Details:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching complaint details:", error.message, error.response?.data);
    Alert.alert("Error", `Failed to fetch complaint details: ${error.message}`);
    return null;
  }
};

// Utility function to calculate labor suitability score
const calculateLaborSuitability = (labor, complaint, currentDate) => {
  let suitabilityScore = 0;

  // Distance Score (50% weight)
  // Assume default coordinates for labor if not provided
  const complaintLat = complaint.latitude || 0;
  const complaintLon = complaint.longitude || 0;
  const laborLat = labor.latitude || 0; // Placeholder: labor should have coordinates
  const laborLon = labor.longitude || 0; // Placeholder: labor should have coordinates
  const distance = Math.sqrt(
    Math.pow(complaintLat - laborLat, 2) + Math.pow(complaintLon - laborLon, 2)
  );
  const maxDistance = 0.1; // Arbitrary max distance for normalization
  const distanceScore = Math.max(0, 1 - distance / maxDistance) * 50;
  suitabilityScore += distanceScore;

  // Area Score (30% weight)
  let areaScore = 0;
  if (Array.isArray(labor.labourWorkingArea) && complaint.address) {
    const addressLower = complaint.address.toLowerCase();
    const areaMatch = labor.labourWorkingArea.some(area =>
      addressLower.includes(area.toLowerCase())
    );
    areaScore = areaMatch ? 30 : 0;
  }
  suitabilityScore += areaScore;

  // Availability Score (20% weight)
  let availabilityScore = 20;
  if (labor.locationData && Array.isArray(labor.locationData)) {
    const hasCollectedToday = labor.locationData.some(entry =>
      entry.date === currentDate && entry.status === "Collected"
    );
    availabilityScore = hasCollectedToday ? 0 : 20;
  }
  suitabilityScore += availabilityScore;

  return suitabilityScore;
};

const AllotWorkComplaints = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { complaint } = route.params;
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedTime, setSelectedTime] = useState("9:00 AM - 3:00 PM");
  const [unallocatedLabors, setUnallocatedLabors] = useState([]);
  const [selectedLabor, setSelectedLabor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    const fetchUnallocatedLabors = async () => {
      try {
        const inchargerId = await AsyncStorage.getItem("inchargerId");
        console.log("Retrieved inchargerId from AsyncStorage:", inchargerId);

        if (!inchargerId) {
          console.warn("No inchargerId found in AsyncStorage, using fallback: 67fb94808911f26d4780487d");
          Alert.alert("Warning", "No inchargerId found in AsyncStorage. Using default. Please log in again.");
        }

        const url = `${api}/api/allotwork/unallocated/${inchargerId || "67fb94808911f26d4780487d"}`;
        console.log("Fetching from:", url);
        const response = await axios.get(url);
        console.log("Raw API Response:", response.data);
        const data = response.data;
        if (data && Array.isArray(data)) {
          const unallocated = data.filter(labor => {
            if (labor.locationData && Array.isArray(labor.locationData)) {
              const hasCollectedToday = labor.locationData.some(entry =>
                entry.date === currentDate && entry.status === "Collected"
              );
              return !hasCollectedToday;
            }
            return true;
          });
          // Calculate suitability scores and sort labors
          const scoredLabors = unallocated.map(labor => ({
            ...labor,
            suitabilityScore: calculateLaborSuitability(labor, complaint, currentDate),
          })).sort((a, b) => b.suitabilityScore - a.suitabilityScore);
          setUnallocatedLabors(scoredLabors);
        } else {
          setUnallocatedLabors([]);
          console.warn("No unallocated labors found or invalid data:", data);
        }
      } catch (error) {
        console.error("Error fetching unallocated labors:", error.message, error.response?.data);
        Alert.alert("Error", "Failed to fetch unallocated labors. Please check your network or server.");
        setUnallocatedLabors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUnallocatedLabors();
  }, [currentDate]);

  const handleLaborSelection = (labor) => {
    setSelectedLabor(labor);
  };

  const handleSubmit = async () => {
    if (!selectedLabor) {
      Alert.alert("Error", "Please select a labor to allocate.");
      return;
    }

    console.log("Debug: Complaint object:", complaint);
    const complaintId = complaint.complaintId || complaint._id;
    if (!complaintId) {
      Alert.alert("Error", "No complaintId found in complaint object.");
      return;
    }

    try {
      const inchargerId = await AsyncStorage.getItem("inchargerId") || "67fb94808911f26d4780487d";
      console.log("inchargerId used for submission:", inchargerId);

      const complaintDetails = await fetchComplaintDetails(complaintId, api);

      const inchargerName = unallocatedLabors.find(labor => labor.inchargerId === inchargerId)?.inchargerName || "Siva";

      let latitude = 0;
      let longitude = 0;
      if (complaintDetails?.location?.coordinates && Array.isArray(complaintDetails.location.coordinates) && complaintDetails.location.coordinates.length === 2) {
        [longitude, latitude] = complaintDetails.location.coordinates;
        console.log("Extracted Coordinates - Latitude:", latitude, "Longitude:", longitude);
      } else {
        console.warn("Invalid or missing location coordinates in complaintDetails:", complaintDetails?.location);
      }

      const locationData = [
        {
          userId: complaintDetails?.user || complaint.user || "defaultUserId",
          userAddress: complaintDetails?.address || complaint.address || "Unknown Address",
          description: complaintDetails?.description || complaint.description || "No description",
          photoUrl: complaintDetails?.photo || complaint.photo || "",
          date: selectedDate,
          time: selectedTime,
          status: "pending",
          todayStatus: "NO",
          username: complaintDetails?.userName || complaint.userName || "Unknown User",
          latitude,
          longitude,
        },
      ];

      const payload = {
        inchargerId,
        inchargerName,
        labourId: selectedLabor.labourid,
        labourName: selectedLabor.name,
        labourPhoneNumber: selectedLabor.phoneNumber,
        street: selectedLabor.labourWorkingArea
          ? selectedLabor.labourWorkingArea.join(", ")
          : "Vaigai",
        date: selectedDate,
        time: selectedTime,
        status: "pending",
        complaintId,
        locationData,
      };

      console.log("Request URL:", `${api}/api/workallocation`);
      console.log("Request Payload:", payload);

      const response = await axios.post(`${api}/api/workallocation`, payload);
      Alert.alert("Success", "Work allocation saved successfully!");

      navigation.navigate("InchargerComplaints", {
        newAllocation: {
          complaintId,
          status: "pending",
          labourName: selectedLabor.name,
        },
      });
    } catch (error) {
      console.error("Error allocating work:", error.message, error.response?.data);
      Alert.alert("Error", `Failed to allocate work: ${error.message}`);
    }
  };

  const handleShowMap = () => {
    setShowMap(!showMap);
  };

  const filteredLabors = unallocatedLabors.filter(labor =>
    labor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    labor.phoneNumber.includes(searchQuery) ||
    (Array.isArray(labor.labourWorkingArea) &&
      labor.labourWorkingArea.some(area =>
        area.toLowerCase().includes(searchQuery.toLowerCase())
      ))
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6BBE44" />
        <Text style={styles.loadingText}>Loading labors...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Allocate Work</Text>
          <Text style={styles.headerSubtitle}>{currentDate}</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.complaintCard}>
          <View style={styles.cardRow}>
            <Ionicons name="person" size={24} color="#6BBE44" />
            <Text style={styles.cardText}>User: {complaint.userName || "Unknown User"}</Text>
          </View>
          <View style={styles.cardRow}>
            <Ionicons name="location" size={24} color="#6BBE44" />
            <Text style={styles.cardText}>Address: {complaint.address || "Unknown Address"}</Text>
          </View>
          <View style={styles.cardRow}>
            <Ionicons name="document-text" size={24} color="#6BBE44" />
            <Text style={styles.cardText}>Description: {complaint.description || "No description"}</Text>
          </View>
          {complaint.photo ? (
            <Image source={{ uri: complaint.photo }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="image-outline" size={40} color="#7f8c8d" />
              <Text style={styles.photoPlaceholderText}>No Photo Available</Text>
            </View>
          )}
        </View>
        <View style={styles.inputContainer}>
          <Ionicons name="calendar-outline" size={20} color="#6BBE44" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={selectedDate}
            onChangeText={setSelectedDate}
            placeholder="Select Date"
            placeholderTextColor="#7f8c8d"
          />
        </View>
        <View style={styles.pickerContainer}>
          <Ionicons name="chevron-down" size={20} color="#6BBE44" style={styles.pickerIcon} />
          <Picker
            selectedValue={selectedTime}
            onValueChange={setSelectedTime}
            style={styles.picker}
          >
            <Picker.Item label="9:00 AM - 3:00 PM" value="9:00 AM - 3:00 PM" />
            <Picker.Item label="3:00 PM - 9:00 PM" value="3:00 PM - 9:00 PM" />
          </Picker>
        </View>
        <View style={styles.inputContainer}>
          <Ionicons name="search-outline" size={20} color="#6BBE44" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name, phone, or location"
            placeholderTextColor="#7f8c8d"
          />
        </View>
        <Text style={styles.sectionText}>Unallocated Labors:</Text>
        {filteredLabors.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={60} color="#6BBE44" />
            <Text style={styles.emptyText}>No unallocated labors available</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={() => fetchUnallocatedLabors()}>
              <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredLabors.map((labor, index) => (
            <TouchableOpacity
              key={labor.labourid || Math.random().toString()}
              style={styles.laborItem}
              onPress={() => handleLaborSelection(labor)}
              activeOpacity={0.7}
            >
              <View style={styles.laborInfo}>
                <View style={styles.laborRow}>
                  <Ionicons name="person" size={18} color="#6BBE44" />
                  <Text style={styles.laborText}>{labor.name}</Text>
                </View>
                <View style={styles.laborRow}>
                  <Ionicons name="call" size={18} color="#6BBE44" />
                  <Text style={styles.laborText}>{labor.phoneNumber}</Text>
                </View>
                <View style={styles.laborRow}>
                  <Ionicons name="location" size={18} color="#6BBE44" />
                  <Text style={styles.laborText}>
                    {labor.labourWorkingArea ? labor.labourWorkingArea.join(", ") : "No working area"}
                  </Text>
                </View>
              </View>
              <View style={styles.laborActions}>
                {index === 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Recommended</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.plusButton}
                  onPress={() => handleLaborSelection(labor)}
                >
                  <Ionicons name="add-circle" size={30} color="#6BBE44" />
                </TouchableOpacity>
                {selectedLabor && selectedLabor.labourid === labor.labourid && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Selected</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#FFFFFF" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Allocate Work</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.mapButton} onPress={handleShowMap}>
          <Ionicons name="map-outline" size={24} color="#FFFFFF" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>{showMap ? "Hide Map" : "Show Map"}</Text>
        </TouchableOpacity>
        {showMap && (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              region={{
                latitude: complaint.latitude || 0,
                longitude: complaint.longitude || 0,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{
                  latitude: complaint.latitude || 0,
                  longitude: complaint.longitude || 0,
                }}
                title="Complaint Location"
              >
                <Ionicons name="location-sharp" size={30} color="#e74c3c" />
              </Marker>
            </MapView>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 15,
    backgroundColor: "#6BBE44",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    marginTop: 20,
  },
  backButton: {
    padding: 10,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Roboto",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 5,
    fontFamily: "Roboto",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  complaintCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E8ECEF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  cardText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 10,
    flex: 1,
    fontFamily: "Roboto",
  },
  photo: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    marginTop: 10,
  },
  photoPlaceholder: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    backgroundColor: "#E8ECEF",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  photoPlaceholderText: {
    fontSize: 14,
    color: "#7f8c8d",
    marginTop: 5,
    fontFamily: "Roboto",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E8ECEF",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inputIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: "#333",
    fontFamily: "Roboto",
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E8ECEF",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  pickerIcon: {
    marginLeft: 12,
    marginRight: 8,
  },
  picker: {
    flex: 1,
    height: 50,
    color: "#333",
    fontFamily: "Roboto",
  },
  sectionText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
    fontFamily: "Roboto",
  },
  laborItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E8ECEF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  laborInfo: {
    flex: 1,
  },
  laborRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  laborText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginLeft: 8,
    fontFamily: "Roboto",
  },
  laborActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    backgroundColor: "rgba(46, 204, 113, 0.1)",
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    color: "#6BBE44",
    fontWeight: "600",
    fontFamily: "Roboto",
  },
  plusButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6BBE44",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6BBE44",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Roboto",
  },
  mapContainer: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E8ECEF",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  map: {
    width: "100%",
    height: 300,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 18,
    color: "#6BBE44",
    fontFamily: "Roboto",
  },
  emptyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyText: {
    fontSize: 16,
    color: "#333",
    marginVertical: 10,
    textAlign: "center",
    fontFamily: "Roboto",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6BBE44",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  refreshButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
    fontFamily: "Roboto",
  },
});

export default AllotWorkComplaints;