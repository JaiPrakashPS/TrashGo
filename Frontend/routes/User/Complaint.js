import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  Alert,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import API_BASE_URL from "../../api";
import { useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import styles from "./ComplaintsStyle";

const { width } = Dimensions.get("window");

const Complaint = ({ navigation }) => {
  const route = useRoute();
  const { locationData } = route.params || {};

  const [latitude, setLatitude] = useState(locationData?.latitude || null);
  const [longitude, setLongitude] = useState(locationData?.longitude || null);
  const [address, setAddress] = useState("");
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState("");
  const [mainArea, setMainArea] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-250)).current;
  const [uploadMessage, setUploadMessage] = useState("");
  const [userId, setUserId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [areaOptions, setAreaOptions] = useState([{ label: "Select Main Area", value: "" }]);
  const [isLoadingAreas, setIsLoadingAreas] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(true);

  // Function to update address based on coordinates
  const updateLocation = async (latitude, longitude) => {
    try {
      console.log("📍 Updating location:", { latitude, longitude });
      
      if (!latitude || !longitude || latitude === 0 || longitude === 0) {
        setAddress("Invalid location. Please adjust the map.");
        return;
      }
      
      const addressData = await Location.reverseGeocodeAsync({ latitude, longitude });
      console.log("📍 Reverse Geocode Result:", addressData);
      
      if (addressData && addressData[0]) {
        const { street, district, subregion, city, region, country, postalCode } = addressData[0];
        
        let fullAddress = "";
        
        if (street) fullAddress += street;
        if (district && district !== street) fullAddress += (fullAddress ? `, ${district}` : district);
        if (city) fullAddress += (fullAddress ? `, ${city}` : city);
        if (region) fullAddress += (fullAddress ? `, ${region}` : region);
        if (postalCode) fullAddress += ` ${postalCode}`;
        if (country) fullAddress += (fullAddress ? `, ${country}` : country);
        
        if (fullAddress) {
          setAddress(fullAddress);
        } else {
          setAddress("Address not found. Please enter manually or adjust the map.");
        }
      } else {
        setAddress("Address not found. Please enter manually or adjust the map.");
      }
    } catch (error) {
      console.error("❌ Reverse Geocoding Error:", error.message, error.code);
      setAddress("Address not found. Please check your internet connection or enter manually.");
    }
  };

  useEffect(() => {
    const fetchUserIdAndLocation = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("userId");
        if (storedUserId?.trim()) {
          setUserId(storedUserId);
        } else {
          Alert.alert("⚠ Error", "User not logged in. Please log in again.", [
            { text: "OK", onPress: () => navigation.navigate("userlogin") },
          ]);
        }

        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Denied",
            "Location permission is required. Please enable it in settings and restart the app.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => Location.openSettings() },
            ]
          );
          setLoading(false);
          return;
        }

        console.log("📍 Requesting current location...");
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeout: 15000,
          maximumAge: 10000,
        });
        
        const { latitude, longitude } = location.coords;
        console.log("📍 Location fetched:", { latitude, longitude });

        if (latitude && longitude) {
          setLatitude(latitude);
          setLongitude(longitude);
          await updateLocation(latitude, longitude);
        } else {
          throw new Error("Invalid location data received");
        }
      } catch (error) {
        console.error("❌ Location Fetch Error:", error.message, error.code);
        Alert.alert(
          "❌ Location Error",
          `Unable to fetch location: ${error.message}. Using default location or please select on map.`,
          [{ text: "OK" }]
        );
        setLatitude(37.78825);
        setLongitude(-122.4324);
        await updateLocation(37.78825, -122.4324);
      } finally {
        setLoading(false);
      }
    };

    fetchUserIdAndLocation();
  }, [navigation]);

  useEffect(() => {
    const fetchSupervisingAreas = async () => {
      setIsLoadingAreas(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/complaints/supervising-areas`);
        const { supervisingAreas } = response.data;

        if (supervisingAreas?.length > 0) {
          const options = [
            { label: "Select Main Area", value: "" },
            ...supervisingAreas.map((area) => ({ label: area, value: area })),
          ];
          setAreaOptions(options);
        } else {
          Alert.alert("⚠ Warning", "No supervising areas available.");
        }
      } catch (error) {
        Alert.alert("❌ Error", "Failed to load supervising areas. Please try again.");
      } finally {
        setIsLoadingAreas(false);
      }
    };

    fetchSupervisingAreas();
  }, []);

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
    Animated.timing(slideAnim, {
      toValue: menuVisible ? -250 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const pickImage = async (source = "library") => {
    let permissionStatus;
    if (source === "camera") {
      permissionStatus = await ImagePicker.requestCameraPermissionsAsync();
      if (permissionStatus.status !== "granted") {
        Alert.alert("Permission Denied", "Sorry, we need camera permissions to take a photo!");
        return;
      }
    } else {
      permissionStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionStatus.status !== "granted") {
        Alert.alert("Permission Denied", "Sorry, we need media library permissions to pick a photo!");
        return;
      }
    }

    let result;
    try {
      if (source === "camera") {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });
      }
    } catch (error) {
      console.error("❌ ImagePicker Error:", error);
      Alert.alert("Error", `Failed to access ${source}. Please check permissions or try again.`);
      return;
    }

    if (result && !result.canceled) {
      const localUri = result.assets[0].uri;
      const formData = new FormData();
      const filename = localUri.split("/").pop();
      const match = /\.(\w+)$/.exec(filename);
      const fileType = match ? `image/${match[1]}` : `image`;

      formData.append("photo", {
        uri: localUri,
        name: filename,
        type: fileType,
      });

      try {
        const response = await axios.post(`${API_BASE_URL}/api/complaints/validate-image`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 10000,
        });

        if (response.data.valid) {
          setImage(localUri);
          setUploadMessage("✅ Image uploaded successfully!");
        } else {
          setImage(null);
          setUploadMessage(`🔍 Validation Result - isTrash: false Reason: ${response.data.reason || "this is not trash or garbage."} ❌ Sending invalid response with 400 status`);
        }
      } catch (error) {
        console.error("❌ Image Validation Error Details:", {
          message: error.message,
          code: error.code,
          response: error.response ? error.response.data : "No response",
          status: error.response ? error.response.status : "No status",
        });
        if (error.response && error.response.status === 400) {
          setImage(null);
          setUploadMessage(`🔍 Validation Result - isTrash: false Reason: ${error.response.data.reason || "this is not trash or garbage."} ❌ Sending invalid response with 400 status`);
        } else if (error.code === "ECONNABORTED") {
          setUploadMessage("❌ Network timeout. Please check your internet connection and try again.");
        } else if (error.message === "Network Error") {
          setUploadMessage("❌ Network error. Please ensure you are connected to the internet and try again.");
        } else if (error.response && error.response.status === 500) {
          setUploadMessage("❌ Server Error: Image validation failed. Please try again later.");
        } else {
          setUploadMessage("❌ Unexpected error occurred. Please try again or contact support.");
        }
      }
    } else {
      setUploadMessage("");
    }
  };

  const handleComplaintSubmit = async () => {
    if (!userId?.trim() || !image || !address || !description || !longitude || !latitude || !mainArea) {
      Alert.alert("⚠ Missing Fields", "Please fill all fields, select a main area, and upload an image.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("address", address);
    formData.append("description", description);
    formData.append("mainArea", mainArea);
    formData.append("longitude", longitude.toString());
    formData.append("latitude", latitude.toString());

    const localUri = image;
    const filename = localUri.split("/").pop();
    const match = /\.(\w+)$/.exec(filename);
    const fileType = match ? `image/${match[1]}` : `image`;

    formData.append("photo", {
      uri: localUri,
      name: filename,
      type: fileType,
    });

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/complaints/add`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.status === 201) {
        Alert.alert("✅ Success", "Complaint submitted successfully!");
        setImage(null);
        setAddress("");
        setDescription("");
        setMainArea("");
        setUploadMessage("");
        navigation.navigate("userhomepage");
      } else {
        Alert.alert("❌ Error", "Something went wrong. Please try again.");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Server error. Please try again.";
      Alert.alert("❌ Submission Failed", errorMessage);
      if (error.response?.status === 404) {
        Alert.alert("⚠ Session Expired", "Please log in again.", [
          { text: "OK", onPress: () => navigation.navigate("userlogin") },
        ]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setLatitude(latitude);
    setLongitude(longitude);
    updateLocation(latitude, longitude);
  };

  const handleMapToggle = () => {
    setShowMap(!showMap);
    if (!showMap && (!latitude || !longitude || latitude === 0 || longitude === 0)) {
      getCurrentLocation();
    }
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Location permission is required. Please enable it in settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Location.openSettings() },
        ]
      );
      setLoading(false);
      return;
    }

    try {
      console.log("📍 Requesting current location again...");
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 15000,
        maximumAge: 10000,
      });
      const { latitude, longitude } = location.coords;
      console.log("📍 Current location fetched:", { latitude, longitude });
      setLatitude(latitude);
      setLongitude(longitude);
      await updateLocation(latitude, longitude);
    } catch (error) {
      console.error("❌ Current Location Error:", error.message, error.code);
      Alert.alert("❌ Error", "Unable to get current location. Please select on map.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6BBE44" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {menuVisible && (
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={toggleMenu} />
      )}

      <View style={styles.header}>
        <TouchableOpacity onPress={toggleMenu} style={styles.menuIcon}>
          <Ionicons name="menu" size={30} color="white" />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.logo}>TRASHGO</Text>
          
        </View>
      </View>

      <Animated.View style={[styles.menu, { left: slideAnim }]} pointerEvents={menuVisible ? "auto" : "none"}>
        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
          <Text style={styles.menuItem}>VIEW MAP</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Complaint")}>
          <Text style={styles.menuItem}>PUT COMPLAINT ON ROAD SIDE GARBAGES</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("userhomepage")}>
          <Text style={styles.menuItem}>Go to Home page</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("userlogin")}>
          <Text style={styles.menuItem}>LOG OUT</Text>
        </TouchableOpacity>
      </Animated.View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>File a Complaint</Text>
          <Text style={styles.subtitle}>Report roadside waste and help keep your community clean</Text>
          
          <View style={styles.form}>
            {/* Location Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location Details</Text>
              
              <TouchableOpacity style={styles.mapButton} onPress={handleMapToggle}>
                <Ionicons name={showMap ? "map-outline" : "location-outline"} size={20} color="#fff" />
                <Text style={styles.buttonText}>
                  {showMap ? "Hide Map" : "Select Location"}
                </Text>
              </TouchableOpacity>

              {showMap && (
                <View style={styles.mapContainer}>
                  <MapView
                    style={styles.map}
                    region={{
                      latitude: latitude || 37.78825,
                      longitude: longitude || -122.4324,
                      latitudeDelta: 0.0922,
                      longitudeDelta: 0.0421,
                    }}
                    onPress={handleMapPress}
                  >
                    {latitude && longitude && (
                      <Marker coordinate={{ latitude, longitude }} title="Complaint Location" />
                    )}
                  </MapView>
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Area</Text>
                {isLoadingAreas ? (
                  <ActivityIndicator size="small" color="#6BBE44" />
                ) : (
                  <View style={styles.pickerWrapper}>
                    <Picker selectedValue={mainArea} onValueChange={setMainArea} style={styles.picker}>
                      {areaOptions.map((option, index) => (
                        <Picker.Item key={index} label={option.label} value={option.value} />
                      ))}
                    </Picker>
                  </View>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter the location address"
                  value={address}
                  onChangeText={setAddress}
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {/* Image Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Evidence</Text>
              
              <View style={styles.imageOptions}>
                <TouchableOpacity 
                  style={[styles.imageButton, styles.primaryButton]} 
                  onPress={() => pickImage("camera")}
                >
                  <Ionicons name="camera-outline" size={24} color="#fff" />
                  <Text style={styles.imageButtonText}>Take Photo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.imageButton, styles.secondaryButton]} 
                  onPress={() => pickImage("library")}
                >
                  <Ionicons name="image-outline" size={24} color="#6BBE44" />
                  <Text style={[styles.imageButtonText, styles.secondaryButtonText]}>Choose from Gallery</Text>
                </TouchableOpacity>
              </View>
              
              {image && (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: image }} style={styles.imagePreview} />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => {
                      setImage(null);
                      setUploadMessage("");
                    }}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              )}
              
              {uploadMessage ? (
                <Text style={[
                  styles.uploadMessage,
                  { color: uploadMessage.includes("✅") ? "#4CAF50" : "#FF3B30" }
                ]}>
                  {uploadMessage}
                </Text>
              ) : null}
            </View>

            {/* Description Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe the issue in detail"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.disabledButton]}
            onPress={handleComplaintSubmit}
            disabled={isSubmitting || isLoadingAreas}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="paper-plane-outline" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.submitButtonText}>Submit Complaint</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.recentComplaintsButton}
            onPress={() => navigation.navigate("recentcomplaints")}
            disabled={isLoadingAreas}
          >
            <Ionicons name="list-outline" size={20} color="#6BBE44" style={styles.buttonIcon} />
            <Text style={styles.recentComplaintsButtonText}>View Recent Complaints</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default Complaint;