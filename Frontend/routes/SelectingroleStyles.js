import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center", // Added to center content vertically
    backgroundColor: "#FFFFFF",
  },
  image: {
    width: "100%",
    height: "46%",
    resizeMode: "cover",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    height: "45%",
  },
  content: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 20, // Reduced from 24 to 20 for compactness
    paddingTop: 24, // Reduced from 32 to 24 for compactness
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    alignItems: "center", // Added to center buttons horizontally
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 8,
    fontFamily: "LuckiestGuy",
  },
  brand: {
    color: "#6BBE44",
    fontFamily: "LuckiestGuy",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666666",
    marginBottom: 20, // Reduced from 32 to 24 for compactness
    textAlign: "center",
    fontFamily: "LuckiestGuy",
    letterSpacing: 1,
  },
  button: {
    width: width * 0.75, // Reduced from 0.85 to 0.75 for compactness
    padding: 12, // Reduced from 16 to 12 for smaller buttons
    marginVertical: 8, // Reduced from 10 to 8 for tighter spacing
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    shadowColor: "#6BBE44",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: "#6BBE44",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6BBE44",
    fontFamily: "LuckiestGuy",
    letterSpacing: 1,
  },
  activeButton: {
    backgroundColor: "#6BBE44",
  },
  activeButtonText: {
    color: "#FFFFFF",
  }
});

export default styles;