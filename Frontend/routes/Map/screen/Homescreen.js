import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MapComponent from "../MapComponent";

const Homescreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>TRASHGO MAP</Text>
      <MapComponent />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
    padding: 20,
  },
});

export default Homescreen;