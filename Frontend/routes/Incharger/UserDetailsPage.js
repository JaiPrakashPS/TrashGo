import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import axios from "axios";
import api from "../../api";

export default function UserDetailsPage() {
  const route = useRoute();
  const navigation = useNavigation();
  const { allotment, inchargerId } = route.params || {};
  const [verifying, setVerifying] = useState(false);

  const handleVerification = async (allotmentId, userId) => {
    try {
      setVerifying(true);
      const response = await axios.put(`${api}/api/allotWork/confirm/${allotmentId}`, {
        userId: userId,
      });

      if (response.data.success) {
        Alert.alert("Success", response.data.message || "Collection verified successfully", [
          {
            text: "OK",
            onPress: () => {
              navigation.navigate("allottedlabourdetails", {
                inchargerId: inchargerId,
                refresh: true,
              });
            },
          },
        ]);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      Alert.alert("Error", "Failed to verify collection: " + errorMsg);
      console.error("Error verifying collection:", error);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Collection Points</Text>
      </View>

      {allotment && allotment.locationData && allotment.locationData.length > 0 ? (
        <View style={styles.locationDataContainer}>
          <Text style={styles.sectionTitle}>Collection Points:</Text>
          {allotment.locationData.map(location => (
            <View key={location.userId} style={styles.locationCard}>
              <View style={styles.locationHeader}>
                <Text style={styles.locationName}>
                  <Ionicons name="person" size={16} color="#4A90E2" /> {location.username || "Unknown"}
                </Text>
                <Text style={[
                  styles.statusBadge,
                  { backgroundColor: location.todayStatus === "NO" ? "#4CAF50" : "#FF9800" }
                ]}>
                  {location.todayStatus || "N/A"}
                </Text>
              </View>

              <Text style={styles.locationAddress}>
                <Ionicons name="home" size={16} color="#4A90E2" /> {location.userAddress || "N/A"}
              </Text>

              {(location.todayStatus === "YES" || !location.acknowledgedAt) && (
                <TouchableOpacity
                  style={[styles.verifyButton, verifying && styles.verifyingButton]}
                  onPress={() => handleVerification(allotment._id, location.userId)}
                  disabled={verifying}
                >
                  <Text style={styles.verifyButtonText}>
                    {verifying ? "Verifying..." : "Verify Collection"}
                  </Text>
                  <Ionicons
                    name={verifying ? "reload" : "checkmark-circle"}
                    size={18}
                    color="white"
                    style={{ marginLeft: 8 }}
                  />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.noDataText}>No collection points available.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  contentContainer: {
    padding: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6BBE44",
    padding: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },
  backButton: {
    padding: 8,
  },
  locationDataContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  locationCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  locationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  locationName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
  },
  locationAddress: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
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
  verifyButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    elevation: 2,
  },
  verifyingButton: {
    backgroundColor: "#9CCC65",
  },
  verifyButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  noDataText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 16,
    fontWeight: "500",
  },
});