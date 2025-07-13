import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Animated, StatusBar } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HamburgerMenu from "../../routes/User/HamburgerMenu";
import styles from "./UserProfileStyle";
import axios from "axios";
import { useIsFocused, useRoute, useNavigation } from "@react-navigation/native";
import MapView, { Marker } from "react-native-maps";
import { Picker } from "@react-native-picker/picker";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import api from "../../api";

const UserProfile = () => {
  const [editMode, setEditMode] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    office: "",
    area: "",
    street: "",
    houseLocation: { latitude: null, longitude: null },
  });
  const [editedProfile, setEditedProfile] = useState({ ...profileData });
  const [availableAreas, setAvailableAreas] = useState([]);
  const [availableStreets, setAvailableStreets] = useState([]);
  const [fadeAnim] = useState(new Animated.Value(0));
  
  const isFocused = useIsFocused();
  const route = useRoute();
  const navigation = useNavigation();

  useEffect(() => {
    fetchProfile();
  }, [isFocused]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (route.params?.locationData) {
      const { address, latitude, longitude } = route.params.locationData;
      setEditedProfile(prev => ({
        ...prev,
        address,
        houseLocation: { latitude, longitude }
      }));
      navigation.setParams({ locationData: null });
    }
  }, [route.params?.locationData]);

  useEffect(() => {
    if (editMode && editedProfile.office) {
      fetchDynamicAreas(editedProfile.office);
    }
    if (editMode && editedProfile.office && editedProfile.area) {
      fetchDynamicStreets(editedProfile.office, editedProfile.area);
    }
  }, [editMode, editedProfile.office, editedProfile.area]);

  const fetchProfile = async () => {
    try {
      if (route.params?.locationData) return;

      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        Alert.alert("Error", "User ID not found. Please login again.");
        return;
      }

      const response = await axios.get(`${api}/api/user/details/${userId}`);
      if (response.status === 200 && response.data.profile) {
        const { name, email, phoneNumber, address, office, area, street, houseLocation } = response.data.profile;
        
        const profile = {
          name,
          email,
          phone: phoneNumber,
          address,
          office,
          area,
          street,
          houseLocation: houseLocation || { latitude: null, longitude: null }
        };
        
        setProfileData(profile);
        setEditedProfile(profile);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      Alert.alert("Error", "Failed to fetch profile");
    }
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
      setEditedProfile(prev => ({
        ...prev,
        office: value,
        area: "",
        street: ""
      }));
      fetchDynamicAreas(value);
      setAvailableStreets([]);
    } else if (field === "area") {
      setEditedProfile(prev => ({
        ...prev,
        area: value,
        street: ""
      }));
      fetchDynamicStreets(editedProfile.office, value);
    } else {
      setEditedProfile(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        Alert.alert("Error", "User not identified");
        return;
      }

      const response = await axios.put(`${api}/api/user/update/${userId}`, {
        name: editedProfile.name,
        email: editedProfile.email,
        phoneNumber: editedProfile.phone,
        address: editedProfile.address,
        office: editedProfile.office,
        area: editedProfile.area,
        street: editedProfile.street,
        location: {
          type: "Point",
          coordinates: [
            editedProfile.houseLocation.longitude || 0,
            editedProfile.houseLocation.latitude || 0
          ]
        }
      });

      if (response.status === 200) {
        setProfileData(editedProfile);
        setEditMode(false);
        setShowMap(false);
        Alert.alert("Success", "Profile updated successfully");
      }
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const updateAddressFromLocation = async (latitude, longitude) => {
    try {
      const addressData = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addressData?.[0]) {
        const { street, city, region, country } = addressData[0];
        const newAddress = `${street || ""}${city ? ", " + city : ""}${region ? ", " + region : ""}${country ? ", " + country : ""}`.trim();
        setEditedProfile(prev => ({
          ...prev,
          address: newAddress || "Unknown address",
          houseLocation: { latitude, longitude }
        }));
      } else {
        setEditedProfile(prev => ({
          ...prev,
          address: "Unable to fetch address",
          houseLocation: { latitude, longitude }
        }));
      }
    } catch (error) {
      console.warn("Reverse geocoding failed:", error);
      setEditedProfile(prev => ({
        ...prev,
        address: "Error fetching address",
        houseLocation: { latitude, longitude }
      }));
    }
  };

  const handleMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    updateAddressFromLocation(latitude, longitude);
  };

  return (
    <View style={styles.outerContainer}>
      <StatusBar barStyle="light-content" />
      
      <Animated.ScrollView 
        contentContainerStyle={styles.scrollContainer}
        style={{ opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {editedProfile.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.profileName}>{editedProfile.name}</Text>
          <Text style={styles.profileEmail}>{editedProfile.email}</Text>
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color="#6BBE44" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, editMode && styles.inputEditable]}
              value={editedProfile.name}
              onChangeText={(text) => handleChange("name", text)}
              placeholder="Full Name"
              editable={editMode}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color="#6BBE44" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, editMode && styles.inputEditable]}
              value={editedProfile.email}
              onChangeText={(text) => handleChange("email", text)}
              placeholder="Email Address"
              editable={editMode}
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="call-outline" size={20} color="#6BBE44" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, editMode && styles.inputEditable]}
              value={editedProfile.phone}
              onChangeText={(text) => handleChange("phone", text)}
              placeholder="Phone Number"
              editable={editMode}
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>Location Details</Text>
          
          <View style={styles.inputWrapper}>
            <Ionicons name="home-outline" size={20} color="#6BBE44" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.textArea, editMode && styles.inputEditable]}
              value={editedProfile.address}
              onChangeText={(text) => handleChange("address", text)}
              placeholder="Home Address"
              editable={editMode}
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={styles.pickerContainer}>
            <View style={styles.pickerLabelWrapper}>
              <Ionicons name="business-outline" size={16} color="#6BBE44" />
              <Text style={styles.pickerLabel}>Office</Text>
            </View>
            <View style={[styles.pickerWrapper, editMode && styles.pickerEditable]}>
              <Picker
                selectedValue={editedProfile.office}
                onValueChange={(value) => handleChange("office", value)}
                style={styles.picker}
                enabled={editMode}
              >
                <Picker.Item label="Select Office" value="" color="#9CA3AF" />
                <Picker.Item label="Corporation" value="Corporation" />
                <Picker.Item label="Village Panchayat" value="Village Panchayat" />
                <Picker.Item label="Town Panchayat" value="Town Panchayat" />
                <Picker.Item label="City" value="City" />
              </Picker>
            </View>
          </View>

          {editedProfile.office && (
            <View style={styles.pickerContainer}>
              <View style={styles.pickerLabelWrapper}>
                <Ionicons name="location-outline" size={16} color="#6BBE44" />
                <Text style={styles.pickerLabel}>Area</Text>
              </View>
              <View style={[styles.pickerWrapper, editMode && styles.pickerEditable]}>
                <Picker
                  selectedValue={editedProfile.area}
                  onValueChange={(value) => handleChange("area", value)}
                  style={styles.picker}
                  enabled={editMode}
                >
                  <Picker.Item label="Select Area" value="" color="#9CA3AF" />
                  {availableAreas.map(area => (
                    <Picker.Item key={area} label={area} value={area} />
                  ))}
                </Picker>
              </View>
            </View>
          )}

          {editedProfile.office && editedProfile.area && (
            <View style={styles.pickerContainer}>
              <View style={styles.pickerLabelWrapper}>
                <Ionicons name="navigate-outline" size={16} color="#6BBE44" />
                <Text style={styles.pickerLabel}>Street</Text>
              </View>
              <View style={[styles.pickerWrapper, editMode && styles.pickerEditable]}>
                <Picker
                  selectedValue={editedProfile.street}
                  onValueChange={(value) => handleChange("street", value)}
                  style={styles.picker}
                  enabled={editMode}
                >
                  <Picker.Item label="Select Street" value="" color="#9CA3AF" />
                  {availableStreets.map(street => (
                    <Picker.Item key={street} label={street} value={street} />
                  ))}
                </Picker>
              </View>
            </View>
          )}

          {editedProfile.houseLocation.latitude && (
            <View style={styles.coordContainer}>
              <View style={styles.coordItem}>
                <Ionicons name="location" size={16} color="#6BBE44" />
                <Text style={styles.coordText}>
                  Lat: {editedProfile.houseLocation.latitude.toFixed(6)}
                </Text>
              </View>
              <View style={styles.coordItem}>
                <Ionicons name="location" size={16} color="#6BBE44" />
                <Text style={styles.coordText}>
                  Long: {editedProfile.houseLocation.longitude.toFixed(6)}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.changeLocationButton, !editMode && styles.disabledButton]}
            onPress={() => editMode && setShowMap(!showMap)}
            disabled={!editMode}
          >
            <Ionicons 
              name={showMap ? "map" : "map-outline"} 
              size={20} 
              color="#FFFFFF" 
              style={styles.buttonIcon}
            />
            <Text style={styles.changeLocationText}>
              {showMap ? "HIDE MAP" : "CHANGE HOUSE LOCATION"}
            </Text>
          </TouchableOpacity>

          {showMap && editMode && (
            <View style={styles.mapWrapper}>
              <MapView
                style={styles.map}
                onPress={handleMapPress}
                initialRegion={{
                  latitude: editedProfile.houseLocation.latitude || 0,
                  longitude: editedProfile.houseLocation.longitude || 0,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: editedProfile.houseLocation.latitude || 0,
                    longitude: editedProfile.houseLocation.longitude || 0,
                  }}
                  draggable
                  onDragEnd={handleMapPress}
                />
              </MapView>
            </View>
          )}
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
            style={styles.logoutButton}
            onPress={() => navigation.navigate("userlogin")}
          >
            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.logoutText}>LOGOUT</Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
    </View>
  );
};

export default UserProfile;