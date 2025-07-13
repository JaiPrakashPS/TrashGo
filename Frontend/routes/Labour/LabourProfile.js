import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  ScrollView,
  TextInput, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../api";

export default function LabourProfile({ navigation }) {
  const [labourId, setLabourId] = useState(null);
  const [profile, setProfile] = useState({
    name: "",
    phoneNumber: "",
    labourWorkingArea: [],
    supervisingArea: "",
    labourid: "",
    inchargerId: "",
    inchargerPhone: "",
    office: "",
    inchargerName: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLabourIdAndProfile = async () => {
      try {
        const id = await AsyncStorage.getItem("labourId");
        if (id) {
          setLabourId(id);
          const response = await axios.get(`${api}/api/labour/detail/labour/${id}`);
          const data = response.data;
          setProfile({
            name: data.name || "",
            phoneNumber: data.phoneNumber || "",
            labourWorkingArea: Array.isArray(data.labourWorkingArea) ? data.labourWorkingArea : [],
            supervisingArea: data.supervisingArea || "",
            labourid: data.labourid || "",
            inchargerId: data.inchargerId || "",
            inchargerPhone: data.inchargerPhone || "",
            office: data.office || "",
            inchargerName: data.inchargerName || ""
          });
        } else {
          setError("No labour ID found. Please login again.");
        }
      } catch (err) {
        console.error("Error fetching profile:", err.message);
        if (err.response?.status === 404) {
          setError("Profile not found. Please check your account details.");
        } else {
          setError("Failed to load profile. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchLabourIdAndProfile();
  }, []);

  const handleEdit = () => {
    // Future implementation for edit functionality
    navigation.navigate("EditProfile", { profile });
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("labourId");
      navigation.reset({
        index: 0,
        routes: [{ name: "labourlogin" }],
      });
    } catch (err) {
      console.error("Error during logout:", err);
      alert("Failed to logout. Please try again.");
    }
  };

  const renderProfileItem = (label, value, placeholder) => (
    <View style={styles.profileItem}>
      <Text style={styles.itemLabel}>{label}</Text>
      <TextInput 
        style={styles.itemValue}
        value={value}
        placeholder={placeholder}
        placeholderTextColor="#777"
        editable={false}
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6BBE44" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Image 
          source={require("../../assets/profile.png")} 
          style={styles.errorIcon} 
        />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.replace("labourlogin")}
        >
          <Text style={styles.retryButtonText}>Return to Login</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#6BBE44" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Labour Profile</Text>
        <View style={styles.userIconContainer}>
          <Image 
            source={require("../../assets/profile.png")} 
            style={styles.profileIcon} 
          />
        </View>
      </View>

      {/* Profile Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileContainer}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
              </Text>
            </View>
            <Text style={styles.profileName}>{profile.name || "User"}</Text>
          </View>

          <View style={styles.profileContent}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            {renderProfileItem("Name", profile.name, "Name not available")}
            {renderProfileItem("Phone Number", profile.phoneNumber, "Phone number not available")}
            
            <Text style={styles.sectionTitle}>Work Information</Text>
            {renderProfileItem(
              "Working Area", 
              profile.labourWorkingArea.join(", "), 
              "No working area assigned"
            )}
            {renderProfileItem(
              "Supervising Area", 
              profile.supervisingArea, 
              "No supervising area assigned"
            )}
            
            <Text style={styles.sectionTitle}>Supervisor Details</Text>
            {renderProfileItem(
              "Incharger Name", 
              profile.inchargerName, 
              "No incharger assigned"
            )}
            {renderProfileItem(
              "Incharger Phone", 
              profile.inchargerPhone, 
              "No incharger phone available"
            )}
            {renderProfileItem("Office", profile.office, "No office assigned")}
          </View>
        </View>
      </ScrollView>
      
      {/* Bottom Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#555",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  errorIcon: {
    width: 80,
    height: 80,
    marginBottom: 20,
    opacity: 0.5,
  },
  errorText: {
    fontSize: 16,
    color: "#d32f2f",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#6BBE44",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#6BBE44",
    paddingHorizontal: 20,
    paddingVertical: 16,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  userIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  profileIcon: {
    width: 24,
    height: 24,
    tintColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  profileContainer: {
    margin: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
  },
  profileHeader: {
    backgroundColor: "#f0f8f1",
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#6BBE44",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  profileName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  profileContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6BBE44",
    marginTop: 16,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  profileItem: {
    marginBottom: 12,
  },
  itemLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  itemValue: {
    fontSize: 16,
    color: "#333",
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  actionContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  editButton: {
    backgroundColor: "#6BBE44",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
    elevation: 1,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  logoutButton: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d32f2f",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#d32f2f",
  }
});