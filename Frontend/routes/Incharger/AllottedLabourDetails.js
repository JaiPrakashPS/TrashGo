import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import axios from "axios";
import api from "../../api";

export default function AllottedLabourDetails() {
  const route = useRoute();
  const navigation = useNavigation();
  const { inchargerId, refresh } = route.params || {};
  const [allotments, setAllotments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const fetchAllotments = async () => {
    if (!inchargerId) {
      setError("Incharger ID is missing. Please try again.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`${api}/api/allotWork/allotments/${inchargerId}`);
      const sortedAllotments = response.data.sort((a, b) => {
        if (a.status === "Pending" && b.status !== "Pending") return -1;
        if (a.status !== "Pending" && b.status === "Pending") return 1;
        if (a.status === "Collected" && b.status !== "Collected") return -1;
        if (a.status !== "Collected" && b.status === "Collected") return 1;
        return 0;
      });
      setAllotments(sortedAllotments);
      console.log("Fetched allotments:", sortedAllotments.map(a => ({
        id: a._id,
        status: a.status,
        locationData: a.locationData.map(loc => ({
          userId: loc.userId,
          todayStatus: loc.todayStatus,
          acknowledgedAt: loc.acknowledgedAt,
        })),
      })));
    } catch (err) {
      setError("Failed to fetch allotted work. Check server or network. Error: " + err.message);
      console.error("Error fetching allotments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllotments();
  }, [inchargerId, refresh]);

  const handleVerification = async (allotmentId, userId) => {
    try {
      setVerifying(true);
      const response = await axios.put(`${api}/api/allotWork/confirm/${allotmentId}`, {
        userId: userId,
      });

      if (response.data.success) {
        Alert.alert("Success", "Collection verified successfully");
        await fetchAllotments();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      Alert.alert("Error", "Failed to verify collection: " + errorMsg);
      console.error("Error verifying collection:", error);
    } finally {
      setVerifying(false);
    }
  };

  const handleFinalize = async (allotmentId) => {
    try {
      const response = await axios.put(`${api}/api/allotWork/finalize/${allotmentId}`);
      if (response.data.success) {
        Alert.alert(
          "Success",
          "Collection has been finalized successfully",
          [{ text: "OK", onPress: () => fetchAllotments() }]
        );
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      Alert.alert("Error", "Failed to finalize collection: " + errorMsg);
    }
  };

  const handleRemove = async (allotment) => {
    Alert.alert(
      "Remove Allotted Work",
      `Are you sure you want to remove ${allotment.labourName}'s allotted work?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("Sending DELETE request:", {
                inchargerId,
                labourId: allotment.labourId,
                street: allotment.street,
                date: new Date(allotment.date).toISOString(),
              });

              const response = await axios.delete(
                `${api}/api/allotWork/remove/${inchargerId}/${allotment.labourId}`,
                {
                  params: {
                    street: allotment.street,
                    date: new Date(allotment.date).toISOString(),
                  },
                }
              );

              if (response.status === 200) {
                Alert.alert("Success", "Allotted work removed successfully");
                await fetchAllotments();
              }
            } catch (error) {
              const errorMsg = error.response?.data?.message || error.message;
              console.error("Error removing work:", error);
              Alert.alert("Error", "Failed to remove allotted work: " + errorMsg);
            }
          },
        },
      ]
    );
  };

  const handleViewUserDetails = (allotment) => {
    navigation.navigate("userdetailspage", { allotment, inchargerId });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "yes":
        return "#4CAF50";
      case "pending":
        return "#FF9800";
      case "pendingacknowledgment":
        return "#FFA500";
      case "collected":
        return "#0288D1";
      case "off":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "collected":
        return "checkmark-circle";
      case "pending":
        return "hourglass";
      case "pendingacknowledgment":
        return "time";
      default:
        return "help-circle";
    }
  };

  const filteredAllotments = allotments.filter((allotment) => {
    if (!allotment.completed) return true;
    if (!allotment.completedAt) return true;

    const completedDate = new Date(allotment.completedAt);
    const now = new Date();
    const hoursDiff = (now - completedDate) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6BBE44" />
        <Text style={styles.loadingText}>Loading labour details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchAllotments}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>
        <Ionicons name="people" size={24} color="#2E7D32" /> Allotted Labour Work Details
      </Text>

      {filteredAllotments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#94A3B8" />
          <Text style={styles.noDataText}>No allotted work found for this in-charger.</Text>
        </View>
      ) : (
        filteredAllotments.map((allotment, index) => (
          <View
            key={allotment._id || index}
            style={[
              styles.allotmentCard,
              allotment.status === "Collected" && styles.completedCard,
            ]}
          >
            <View style={styles.headerRow}>
              <View style={styles.labourInfo}>
                <Text style={styles.labourName}>
                  <Ionicons name="person" size={20} color="#4CAF50" /> {allotment.labourName || "N/A"}
                </Text>
                <View style={styles.headerActions}>
                  {allotment.status !== "Collected" && (
                    <TouchableOpacity
                      onPress={() => handleRemove(allotment)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                  <Text style={[styles.statusBadge, { backgroundColor: getStatusColor(allotment.status) }]}>
                    <Ionicons
                      name={getStatusIcon(allotment.status)}
                      size={16}
                      color="white"
                    />
                    {" "}{allotment.status || "Unknown"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Ionicons name="location" size={18} color="#6BBE44" />
                <Text style={styles.detailText}>Area: {allotment.street || "N/A"}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="calendar" size={18} color="#6BBE44" />
                <Text style={styles.detailText}>
                  Date: {allotment.date ? new Date(allotment.date).toLocaleDateString() : "N/A"}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="time" size={18} color="#6BBE44" />
                <Text style={styles.detailText}>Time: {allotment.time || "N/A"}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="call" size={18} color="#6BBE44" />
                <Text style={styles.detailText}>Phone: {allotment.labourPhoneNumber || "N/A"}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => handleViewUserDetails(allotment)}
              style={styles.verifyDetailsButton}
            >
              <Text style={styles.verifyDetailsButtonText}>Verify User Details</Text>
            </TouchableOpacity>
            {allotment.status === "Collected" && (
              <Text style={styles.completedText}>
                <Ionicons name="checkmark-circle" size={16} color="#0288D1" /> Collection Completed
              </Text>
            )}
            {allotment.status === "PendingAcknowledgment" && (
              <Text style={styles.pendingText}>
                <Ionicons name="time" size={16} color="#FFA500" /> Awaiting User Acknowledgments
              </Text>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    marginTop:30,
  },
  contentContainer: {
    padding: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 20,
    textAlign: "center",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 16,
    fontWeight: "500",
  },
  allotmentCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  completedCard: {
    backgroundColor: "#F0FDF4",
    borderLeftWidth: 4,
    borderLeftColor: "#22C55E",
  },
  headerRow: {
    marginBottom: 16,
  },
  labourInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  labourName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    color: "white",
    fontWeight: "600",
  },
  detailsContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailText: {
    fontSize: 15,
    color: "#4B5563",
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  removeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
  },
  verifyDetailsButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-end",
    marginTop: 8,
  },
  verifyDetailsButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  completedText: {
    marginTop: 12,
    fontSize: 14,
    color: "#0288D1",
    fontWeight: "600",
    textAlign: "center",
  },
  pendingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#FFA500",
    fontWeight: "600",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});