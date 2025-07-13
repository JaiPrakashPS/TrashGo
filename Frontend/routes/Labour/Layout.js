import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";

const Layout = ({ children }) => {
  const navigation = useNavigation(); // Get navigation object

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>TRASHGO</Text>
        <TouchableOpacity onPress={() => navigation.navigate("labourprofile")}>
          {/* <Image source={require()} style={styles.profileIcon} /> */}
        </TouchableOpacity>
      </View>

      {/* Screen Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "#6BBE44",
    elevation: 5, // Shadow effect for Android
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    paddingTop: 25,
  },
  logo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff", // Added white color for better visibility
  },
  profileIcon: {
    width: 40,
    height: 40,
  },
  content: {
    flex: 1,
    padding: 10,
  },
});

export default Layout;