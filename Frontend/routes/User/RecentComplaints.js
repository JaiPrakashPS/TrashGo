import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Image } from "react-native";
import axios from "axios";
import API_BASE_URL from "../../api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const RecentComplaints = ({ navigation }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchUserIdAndComplaints = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("userId");
        if (!storedUserId?.trim()) {
          throw new Error("User not logged in");
        }
        setUserId(storedUserId);

        const response = await axios.get(`${API_BASE_URL}/api/complaints/recent`, {
          params: { userId: storedUserId },
        });
        setComplaints(response.data);
      } catch (err) {
        setError("Failed to load your recent complaints. Please log in and try again.");
        console.error("❌ Fetch User Complaints Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserIdAndComplaints();
  }, []);

  const renderItem = ({ item }) => {
    const status = item.assignInchargers.length > 0 && item.assignLabours.length > 0 ? "Collected" : "Pending";
    const inchargerName = item.assignInchargers[0]?.name || "N/A";
    const labourName = item.assignLabours[0]?.name || "N/A";

    return (
      <View style={styles.complaintCard}>
        <View style={styles.complaintContent}>
          {item.photo ? (
            <Image
              source={{ uri: item.photo }}
              style={styles.complaintImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.complaintImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
          <View style={styles.complaintDetails}>
            <Text style={styles.complaintAddress}>{item.address}</Text>
            <Text style={styles.complaintDescription}>{item.description}</Text>
            <Text style={styles.complaintArea}>Area: {item.mainArea}</Text>
            <Text style={styles.complaintLocation}>
              Location: [{item.location.coordinates[0].toFixed(4)}, {item.location.coordinates[1].toFixed(4)}]
            </Text>
            <Text style={styles.complaintDate}>
              Submitted: {new Date(item.createdAt).toLocaleDateString()}
            </Text>
            <Text style={styles.complaintAssigned}>
              Incharger: {inchargerName}, Labour: {labourName}
            </Text>
          </View>
        </View>
        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, { color: status === "Collected" ? "#6BBE44" : "#4682B4" }]}>
            Status: {status}
          </Text>
          {status === "Collected" ? (
            <Ionicons name="checkmark-circle" size={20} color="#6BBE44" />
          ) : (
            <Ionicons name="hourglass" size={20} color="#4682B4" />
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6BBE44" />
        <Text style={styles.loadingText}>Loading your recent complaints...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            setError(null);
            fetchUserIdAndComplaints();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Recent Complaints</Text>
      <FlatList
        data={complaints}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={<Text style={styles.emptyText}>No recent complaints found for you.</Text>}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2D3748",
    textAlign: "center",
    marginBottom: 20,
  },
  complaintCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  complaintContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  complaintImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 15,
  },
  placeholderImage: {
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#718096",
    fontSize: 14,
    fontWeight: "500",
  },
  complaintDetails: {
    flex: 1,
  },
  complaintAddress: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3748",
    marginBottom: 5,
  },
  complaintDescription: {
    fontSize: 14,
    color: "#4A5568",
    marginBottom: 5,
    lineHeight: 20,
  },
  complaintArea: {
    fontSize: 13,
    color: "#718096",
    marginBottom: 3,
  },
  complaintLocation: {
    fontSize: 12,
    color: "#A0AEC0",
    marginBottom: 3,
  },
  complaintDate: {
    fontSize: 12,
    color: "#A0AEC0",
    marginBottom: 3,
  },
  complaintAssigned: {
    fontSize: 12,
    color: "#718096",
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EDF2F7",
    paddingTop: 10,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6BBE44",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },
  errorText: {
    fontSize: 16,
    color: "#E53E3E",
    marginBottom: 15,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#6BBE44",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#718096",
    marginTop: 30,
  },
  listContainer: {
    paddingBottom: 20,
  },
});

export default RecentComplaints;