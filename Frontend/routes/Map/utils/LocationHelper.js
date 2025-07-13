import * as Location from "expo-location";

export const requestLocationPermission = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.warn("Permission to access location was denied");
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error requesting location permission:", error);
    return false;
  }
};

export const getCurrentLocation = async () => {
  try {
    // Ensure Location is not null
    if (!Location) {
      console.error("expo-location module is null.");
      return null;
    }

    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return null;

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
      timeout: 15000,
      maximumAge: 10000,
    });

    if (!location || !location.coords) {
      console.warn("Location data is missing.");
      return null;
    }

    return location.coords;
  } catch (error) {
    console.error("Error getting current location:", error);
    return null;
  }
};