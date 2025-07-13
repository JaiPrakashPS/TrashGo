import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StatusBar,Dimensions,StyleSheet,
  Animated,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import roleselection from "../assets/roleselection.png";

const { width, height } = Dimensions.get("window");

const Selectingrole = () => {
  const navigation = useNavigation();
  const [selectedRole, setSelectedRole] = useState(null);
  const [scaleAnim] = useState({
    user: new Animated.Value(1),
    incharger: new Animated.Value(1),
    labour: new Animated.Value(1),
  });

  const handleRoleSelection = (role) => {
    setSelectedRole(role);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    switch (role) {
      case "user":
        navigation.navigate("userlogin");
        break;
      case "incharger":
        navigation.navigate("Inchargerlogin");
        break;
      case "labour":
        navigation.navigate("labourlogin");
        break;
    }
  };

  const animateButton = (role, toValue) => {
    Animated.spring(scaleAnim[role], {
      toValue,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const renderButton = (role, label) => (
    <Animated.View style={{ transform: [{ scale: scaleAnim[role] }] }}>
      <TouchableOpacity
        style={[
          styles.button,
          selectedRole === role && styles.activeButton,
        ]}
        onPress={() => handleRoleSelection(role)}
        onPressIn={() => animateButton(role, 0.95)}
        onPressOut={() => animateButton(role, 1)}
        accessible={true}
        accessibilityLabel={`Select ${label} role`}
        accessibilityHint={`Navigates to ${label} login screen`}
        accessibilityRole="button"
      >
        <Text
          style={[
            styles.buttonText,
            selectedRole === role && styles.activeButtonText,
          ]}
        >
          {label.toUpperCase()}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <Image source={roleselection} style={styles.image} />
      <View style={styles.overlay} />
      <View style={styles.content}>
        <Text style={styles.title}>
          WELCOME TO{"\n"}
          <Text style={styles.brand}>TRASHGO</Text>
        </Text>
        <Text style={styles.subtitle}>Choose Your Role</Text>
        <View style={styles.buttonContainer}>
          {renderButton("user", "User")}
          {renderButton("incharger", "Incharger")}
          {renderButton("labour", "Labour")}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  image: {
    width: "100%",
    height: height * 0.45, // Reduced from 0.5 to give more content space
    resizeMode: "cover",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    height: height * 0.45,
  },
  content: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 24,
    paddingTop: 24, // Reduced from 40 to 24 for compactness
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    alignItems: "center",
    justifyContent: "center", // Added to center content vertically
  },
  title: {
    fontSize: 36,
    fontFamily: "LuckiestGuy",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 8, // Reduced from 12 to 8 for tighter spacing
    lineHeight: 42,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  brand: {
    color: "#6BBE44",
    fontFamily: "LuckiestGuy",
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#666666",
    marginBottom: 16, // Reduced from 40 to 16 for less space above buttons
    textAlign: "center",
    fontFamily: Platform.select({
      ios: "Helvetica Neue",
      android: "Roboto",
    }),
    letterSpacing: 0.5,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },
  button: {
    width: width * 0.75, // Reduced from 0.85 to 0.75 for compactness
    paddingVertical: 12, // Reduced from 18 to 12 for shorter buttons
    paddingHorizontal: 24,
    marginVertical: 6, // Reduced from 12 to 6 for less space between buttons
    borderRadius: 16, // Reduced from 20 to 16 for subtler curves
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#6BBE44",
    shadowColor: "#6BBE44",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  activeButton: {
    backgroundColor: "#6BBE44",
    borderColor: "#5AA638",
    shadowOpacity: 0.3,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#6BBE44",
    fontFamily: "LuckiestGuy",
    letterSpacing: 1.2,
  },
  activeButtonText: {
    color: "#FFFFFF",
  },
});

export default Selectingrole;