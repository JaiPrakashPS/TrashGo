import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { useNavigation, useRoute } from "@react-navigation/native";

const MapComponent = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentAddress, setCurrentAddress] = useState("");
  const [clickedLocation, setClickedLocation] = useState(null);
  const [clickedAddress, setClickedAddress] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const mapRef = useRef(null);
  const navigation = useNavigation();
  const route = useRoute();
  const { from = "" } = route.params || {};
  const normalizedFrom = from.toLowerCase();

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Denied",
            "Location access is required. Please enable it in settings."
          );
          return;
        }

        const { coords } = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });

        const { latitude, longitude } = coords;
        const address = await getAddressFromCoordinates(latitude, longitude);

        setCurrentLocation({ latitude, longitude });
        setCurrentAddress(address);
      } catch (error) {
        console.error("Location Error:", error);
        Alert.alert("Error", "Unable to fetch location.");
      }
    };

    fetchLocation();
  }, []);

  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      const addressData = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addressData.length > 0) {
        const { street, city, region, country } = addressData[0];
        return `${street || "Street"}, ${city || "City"}, ${region || "Region"}, ${country || "Country"}`;
      }
      return "Address Not Found";
    } catch (error) {
      console.error("Address Error:", error);
      return "Error Fetching Address";
    }
  };

  const handleMapPress = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const address = await getAddressFromCoordinates(latitude, longitude);

    setClickedLocation({ latitude, longitude });
    setClickedAddress(address);
    setModalVisible(true);
  };

  const confirmLocation = () => {
    const finalLocation = clickedLocation || currentLocation;
    const finalAddress = clickedAddress || currentAddress;

    if (!finalLocation || !finalAddress) {
      Alert.alert("Missing Data", "Please select or fetch a location.");
      return;
    }

    const locationData = {
      address: finalAddress,
      latitude: finalLocation.latitude,
      longitude: finalLocation.longitude,
    };

    console.log("✅ Confirmed Location:", locationData);

    switch (normalizedFrom) {
      case "userdetails":
        navigation.navigate("userdetails", { locationData });
        break;
      case "complaint":
        navigation.navigate("complaint", { locationData });
        break;
      case "userprofile":
        navigation.navigate("userprofile", {
          locationData,
          page: "map",
        });
        break;
      default:
        Alert.alert("Navigation Error", `Unknown origin: ${from}`);
    }

    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Address Header */}
      <View style={styles.addressContainer}>
        <Text style={styles.addressText}>📍 Current Address:</Text>
        <Text style={styles.address}>{currentAddress || "Fetching..."}</Text>
      </View>

      {/* Map */}
      {currentLocation ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            ...currentLocation,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          onPress={handleMapPress}
          showsUserLocation
        >
          {clickedLocation && (
            <Marker coordinate={clickedLocation} title="Selected Location" />
          )}
        </MapView>
      ) : (
        <ActivityIndicator size="large" color="blue" />
      )}

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Location</Text>
            <Text style={styles.modalText}>{clickedAddress}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmLocation}
              >
                <Text style={styles.modalButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  addressContainer: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 10,
    elevation: 3,
    zIndex: 2,
  },
  addressText: { fontSize: 14, fontWeight: "bold" },
  address: { fontSize: 16, color: "blue" },
  map: { flex: 1 },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  modalText: { fontSize: 16, textAlign: "center", marginBottom: 20 },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    padding: 10,
    alignItems: "center",
    borderRadius: 5,
    marginHorizontal: 5,
  },
  cancelButton: { backgroundColor: "red" },
  confirmButton: { backgroundColor: "green" },
  modalButtonText: { color: "white", fontWeight: "bold" },
});

export default MapComponent;
