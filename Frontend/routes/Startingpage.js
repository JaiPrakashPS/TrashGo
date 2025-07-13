import React, { useEffect, useRef } from "react";
import { View, Image, StyleSheet, Animated } from "react-native";
import trashgologo from "../assets/trashgologo.jpg";

const Startingpage = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current; // Start opacity at 0
  const scaleAnim = useRef(new Animated.Value(0.8)).current; // Slightly zoomed out

  useEffect(() => {
    // Start fade-in and scale animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate to the next screen after 2 seconds
    const timer = setTimeout(() => {
      navigation.navigate("selectingrole");
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={trashgologo}
        style={[styles.image, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  image: {
    width: 200,
    height: 200,
    resizeMode: "contain",
  },
});

export default Startingpage;
