import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Linking, 
  StatusBar,
  ActivityIndicator,
  ScrollView,
  SafeAreaView
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";
import axios from "axios";
import api from "../../api";

export default function LabourHome({ navigation }) {
  const [supervisorName, setSupervisorName] = useState("");
  const [supervisorPhoneNumber, setSupervisorPhoneNumber] = useState("");
  const [labourName, setLabourName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLabourDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const labourId = await AsyncStorage.getItem("labourId");
        if (!labourId) {
          setError("Labour ID not found. Please login again.");
          navigation.navigate("labourlogin");
          return;
        }

        const response = await axios.get(`${api}/api/labour/labour/${labourId}`);
        const { inchargerName, inchargerPhone, name } = response.data;
        
        if (!inchargerName || !inchargerPhone) {
          setError("Supervisor details not available");
        } else {
          setSupervisorName(inchargerName);
          setSupervisorPhoneNumber(inchargerPhone);
          setLabourName(name || "User");
        }
      } catch (error) {
        console.error("Failed to fetch supervisor details:", error);
        const errorMsg = error.response?.data?.message || error.message;
        setError(`Failed to load supervisor details: ${errorMsg}`);
      } finally {
        setLoading(false);
      }
    };

    fetchLabourDetails();
  }, [navigation]);

  const renderDashboardOptions = () => (
    <View style={styles.dashboardGrid}>
      <TouchableOpacity 
        style={[styles.dashboardItem, styles.areaTheme]} 
        onPress={() => navigation.navigate("allottedareas")}
        disabled={loading}
      >
        <View style={styles.dashboardItemContent}>
          <View style={[styles.iconContainer, styles.areaIconBg]}>
            <Ionicons name="location" size={24} color="#2D9CDB" />
          </View>
          <Text style={styles.itemTitle}>Allotted Areas</Text>
          <Text style={styles.itemDescription}>View your assigned work zones</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.dashboardItem, styles.mapTheme]}
        onPress={() => navigation.navigate("Home")}
        disabled={loading}
      >
        <View style={styles.dashboardItemContent}>
          <View style={[styles.iconContainer, styles.mapIconBg]}>
            <Ionicons name="map" size={24} color="#27AE60" />
          </View>
          <Text style={styles.itemTitle}>Area Map</Text>
          <Text style={styles.itemDescription}>Interactive map view</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.dashboardItem, styles.complaintTheme]}
        onPress={() => navigation.navigate("complaintspage")}
        disabled={loading}
      >
        <View style={styles.dashboardItemContent}>
          <View style={[styles.iconContainer, styles.complaintIconBg]}>
            <Ionicons name="warning" size={24} color="#E74C3C" />
          </View>
          <Text style={styles.itemTitle}>Complaints</Text>
          <Text style={styles.itemDescription}>View & manage all complaints</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.dashboardItem, styles.profileTheme]}
        onPress={() => navigation.navigate("labourprofile")}
        disabled={loading}
      >
        <View style={styles.dashboardItemContent}>
          <View style={[styles.iconContainer, styles.profileIconBg]}>
            <Ionicons name="person" size={24} color="#9B59B6" />
          </View>
          <Text style={styles.itemTitle}>Profile</Text>
          <Text style={styles.itemDescription}>View & edit your profile</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#6BBE44" barStyle="light-content" />
      
      {/* Dashboard Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Labour Dashboard</Text>
            <Text style={styles.headerSubtitle}>
              Welcome back, {loading ? "..." : labourName}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => navigation.navigate("labourprofile")} 
            style={styles.profileButton}
          >
            <View style={styles.profileIconCircle}>
              <Ionicons name="person" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6BBE44" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      ) : error && !supervisorName ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color="#E74C3C" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => navigation.replace("labourlogin")}
          >
            <Text style={styles.retryButtonText}>Return to Login</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Supervisor Card */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>YOUR SUPERVISOR</Text>
            <View style={styles.supervisorCard}>
              <View style={styles.supervisorAvatar}>
                <Ionicons name="person" size={30} color="#fff" />
              </View>
              
              <View style={styles.supervisorInfo}>
                <Text style={styles.supervisorName}>{supervisorName}</Text>
                <View style={styles.phoneContainer}>
                  <Ionicons name="call-outline" size={14} color="#555" />
                  <Text style={styles.phoneNumber}>{supervisorPhoneNumber}</Text>
                </View>
              </View>
              
              <TouchableOpacity 
                onPress={() => Linking.openURL(`tel:${supervisorPhoneNumber}`)} 
                style={styles.callButton}
              >
                <Ionicons name="call" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Dashboard Options */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
            {renderDashboardOptions()}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f9fc",
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    backgroundColor: "#6BBE44",
    paddingTop: 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 5,
  },
  profileButton: {
    padding: 2,
  },
  profileIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  sectionContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 12,
    letterSpacing: 1,
  },
  supervisorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  supervisorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#6BBE44",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  supervisorInfo: {
    flex: 1,
  },
  supervisorName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  phoneNumber: {
    fontSize: 14,
    color: "#555",
    marginLeft: 6,
  },
  callButton: {
    backgroundColor: "#27AE60",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  dashboardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  dashboardItem: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: "hidden",
  },
  dashboardItemContent: {
    padding: 15,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  areaTheme: {
    borderTopWidth: 3,
    borderTopColor: "#2D9CDB",
  },
  mapTheme: {
    borderTopWidth: 3,
    borderTopColor: "#27AE60",
  },
  complaintTheme: {
    borderTopWidth: 3,
    borderTopColor: "#E74C3C",
  },
  profileTheme: {
    borderTopWidth: 3,
    borderTopColor: "#9B59B6",
  },
  areaIconBg: {
    backgroundColor: "rgba(45, 156, 219, 0.1)",
  },
  mapIconBg: {
    backgroundColor: "rgba(39, 174, 96, 0.1)",
  },
  complaintIconBg: {
    backgroundColor: "rgba(231, 76, 60, 0.1)",
  },
  profileIconBg: {
    backgroundColor: "rgba(155, 89, 182, 0.1)",
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  itemDescription: {
    fontSize: 12,
    color: "#777",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6BBE44",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#6BBE44",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "500",
  }
});