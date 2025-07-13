// components/HamburgerMenu.js

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const HamburgerMenu = ({ navigation, title }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-250)).current;

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
    Animated.timing(slideAnim, {
      toValue: menuVisible ? -250 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  return (
    <>
      {menuVisible && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={toggleMenu}
        />
      )}

      <View style={styles.header}>
        <TouchableOpacity onPress={toggleMenu} style={styles.menuIcon}>
          <Ionicons name="menu" size={30} color="black" />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.logo}>{title || "TRASHGO"}</Text>
        </View>
      </View>

      <Animated.View
        style={[styles.menu, { left: slideAnim }]}
        pointerEvents={menuVisible ? "auto" : "none"}
      >
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
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: "#6BBE44",
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    zIndex: 10,
  },
  menuIcon: {
    marginRight: 15,
  },
  headerTitle: {
    flex: 1,
    alignItems: "center",
  },
  logo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  menu: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: -250,
    width: 250,
    backgroundColor: "#333",
    paddingTop: 60,
    paddingLeft: 20,
    zIndex: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  menuItem: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#fff",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    zIndex: 5,
  },
});

export default HamburgerMenu;