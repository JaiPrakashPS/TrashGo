import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  StatusBar,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StyleSheet } from "react-native";
import api from "../../api";

const InchargerProfile = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editStreetModalVisible, setEditStreetModalVisible] = useState(false);
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    office: "",
    supervisingArea: "",
    streetNames: [],
  });

  const [editedProfile, setEditedProfile] = useState({ ...profileData });
  const [selectedStreetNames, setSelectedStreetNames] = useState([]);
  const [editableStreets, setEditableStreets] = useState([]);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchProfile();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const storedInchargerId = await AsyncStorage.getItem("inchargerId");
      if (!storedInchargerId) {
        Alert.alert("Error", "Incharger ID not found. Please login again.");
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${api}/api/inchargerprofile/details/${storedInchargerId}`);
      const data = await response.json();

      if (response.ok && data.profile) {
        setProfileData(data.profile);
        setEditedProfile(data.profile);
        setSelectedStreetNames(data.profile.streetNames || []);
      } else {
        Alert.alert("Error", "Failed to load profile data");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      Alert.alert("Error", "Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStreet = () => {
    setEditableStreets([...editableStreets, ""]);
  };

  const handleRemoveStreet = () => {
    if (editableStreets.length > 1) {
      const newStreets = [...editableStreets];
      newStreets.pop();
      setEditableStreets(newStreets);
    }
  };

  const handleStreetChange = (text, index) => {
    const updated = [...editableStreets]; // Corrected typo
    updated[index] = text;
    setEditableStreets(updated);
  };

  const handleSaveStreets = () => {
    const filteredStreets = editableStreets.filter((street) => street.trim() !== "");
    setSelectedStreetNames(filteredStreets);
    setEditStreetModalVisible(false);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const inchargerId = await AsyncStorage.getItem("inchargerId");

      const updatedProfile = {
        ...editedProfile,
        streetNames: selectedStreetNames,
      };

      const response = await fetch(`${api}/api/inchargerprofile/update/${inchargerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProfile),
      });

      const result = await response.json();

      if (response.ok) {
        setProfileData(updatedProfile);
        setEditMode(false);
        Alert.alert("Success", "Profile updated successfully");
      } else {
        Alert.alert("Update Failed", result.error || "An error occurred");
      }
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert("Error", "New passwords don't match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    try {
      setIsLoading(true);
      const inchargerId = await AsyncStorage.getItem("inchargerId");

      const response = await fetch(`${api}/api/inchargerprofile/changepassword/${inchargerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setChangePasswordModalVisible(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        Alert.alert("Success", "Password changed successfully");
      } else {
        Alert.alert("Error", result.error || "Failed to change password");
      }
    } catch (error) {
      console.error("Password change error:", error);
      Alert.alert("Error", "Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem("inchargerId");
            navigation.navigate("Inchargerlogin");
          },
        },
      ]
    );
  };

  const renderInputField = (label, field, placeholder, icon, keyboardType = "default", secureTextEntry = false) => (
    <View style={styles.inputWrapper}>
      <Ionicons name={icon} size={20} color="#6BBE44" style={styles.inputIcon} />
      <TextInput
        style={[styles.input, !editMode && styles.inputDisabled]}
        value={editedProfile[field]}
        onChangeText={(text) => setEditedProfile((prev) => ({ ...prev, [field]: text }))}
        editable={editMode}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        accessibilityLabel={label}
        accessibilityHint={editMode ? `Enter your ${label.toLowerCase()}` : `${label} (read-only)`}
      />
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.outerContainer}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6BBE44" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.outerContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#6BBE44" />
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContainer}
        style={{ opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{editedProfile.name.charAt(0).toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.profileName}>{editedProfile.name}</Text>
          <Text style={styles.profileEmail}>{editedProfile.email}</Text>
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          {renderInputField("Full Name", "name", "Enter your full name", "person-outline")}
          {renderInputField("Email", "email", "Enter your email address", "mail-outline", "email-address")}
          {renderInputField("Phone", "phone", "Enter your phone number", "call-outline", "phone-pad")}
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>Work Information</Text>
          {renderInputField("Office", "office", "Enter your office location", "business-outline")}
          {renderInputField("Supervising Area", "supervisingArea", "Enter your supervising area", "location-outline")}
          <View style={styles.inputWrapper}>
            <Ionicons name="navigate-outline" size={20} color="#6BBE44" style={styles.inputIcon} />
            <TouchableOpacity
              style={[styles.streetSelector, !editMode && styles.inputDisabled]}
              disabled={!editMode}
              onPress={() => {
                if (editMode) {
                  setEditableStreets([...selectedStreetNames]);
                  setEditStreetModalVisible(true);
                }
              }}
            >
              <Text style={styles.streetSelectorText}>
                {selectedStreetNames.length > 0
                  ? `${selectedStreetNames.length} streets managed`
                  : "No streets assigned"}
              </Text>
              {editMode && <Ionicons name="chevron-forward" size={20} color="#6B7280" />}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, editMode ? styles.saveButton : styles.editButton]}
            onPress={() => (editMode ? handleSave() : setEditMode(true))}
          >
            <Ionicons
              name={editMode ? "checkmark-circle" : "create-outline"}
              size={20}
              color="#FFFFFF"
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>{editMode ? "SAVE CHANGES" : "EDIT PROFILE"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.changePasswordButton]}
            onPress={() => setChangePasswordModalVisible(true)}
          >
            <Ionicons name="lock-closed-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>CHANGE PASSWORD</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.logoutText}>LOGOUT</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={editStreetModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Manage Streets</Text>
                <TouchableOpacity onPress={() => setEditStreetModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#1F2937" />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 300 }}>
                {editableStreets.map((street, index) => (
                  <View key={index} style={styles.streetInputRow}>
                    <TextInput
                      style={styles.streetInput}
                      placeholder={`Street name ${index + 1}`}
                      value={street}
                      onChangeText={(text) => handleStreetChange(text, index)}
                      accessibilityLabel={`Street name ${index + 1}`}
                    />
                    <TouchableOpacity
                      onPress={() => {
                        const updated = [...editableStreets];
                        updated.splice(index, 1);
                        setEditableStreets(updated);
                      }}
                      style={styles.removeStreetButton}
                    >
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.addStreetButton} onPress={handleAddStreet}>
                  <Ionicons name="add" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>ADD STREET</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveStreetsButton} onPress={handleSaveStreets}>
                  <Ionicons name="save-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>SAVE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={changePasswordModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Change Password</Text>
                <TouchableOpacity onPress={() => setChangePasswordModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#1F2937" />
                </TouchableOpacity>
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#6BBE44" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter current password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={passwordData.currentPassword}
                  onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
                  accessibilityLabel="Current Password"
                  accessibilityHint="Enter your current password"
                />
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#6BBE44" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={passwordData.newPassword}
                  onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                  accessibilityLabel="New Password"
                  accessibilityHint="Enter your new password"
                />
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#6BBE44" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm new password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={passwordData.confirmPassword}
                  onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
                  accessibilityLabel="Confirm New Password"
                  accessibilityHint="Confirm your new password"
                />
              </View>
              <TouchableOpacity style={styles.changePasswordButton} onPress={handleChangePassword}>
                <Ionicons name="lock-closed-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>UPDATE PASSWORD</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6B7280",
  },
  scrollContainer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 8,
  },
  avatarContainer: {
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#6BBE44",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: "#6B7280",
  },
  profileSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1F2937",
    backgroundColor: "transparent",
  },
  inputDisabled: {
    backgroundColor: "#F0F0F0",
    color: "#6B7280",
  },
  streetSelector: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1F2937",
    backgroundColor: "transparent",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  streetSelectorText: {
    fontSize: 16,
    color: "#1F2937",
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editButton: {
    backgroundColor: "#2196F3",
  },
  saveButton: {
    backgroundColor: "#34D399",
  },
  changePasswordButton: {
    backgroundColor: "#4A90E2",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
  },
  streetInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  streetInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#1F2937",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
  },
  removeStreetButton: {
    padding: 10,
    marginLeft: 10,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  addStreetButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6BBE44",
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveStreetsButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2196F3",
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default InchargerProfile;