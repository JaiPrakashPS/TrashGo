import { StyleSheet, Dimensions, Platform } from "react-native";

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  image: {
    width: "100%",
    height: "60%",
    resizeMode: "cover",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(107, 190, 68, 0.1)',
    height: "60%",
  },
  formContainer: {
    width: width * 0.9,
    backgroundColor: Platform.select({
      ios: 'rgba(255, 255, 255, 0.95)',
      android: '#FFFFFF',
    }),
    padding: 24,
    borderRadius: 24,
    alignSelf: "center",
    position: "absolute",
    top: "45%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: Platform.select({
      ios: 0,
      android: 1,
    }),
    borderColor: 'rgba(107, 190, 68, 0.2)',
  },
  title: {
    fontSize: 28,
    fontFamily: "LuckiestGuy",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 24,
    letterSpacing: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: "500",
  },
  input: {
    width: "100%",
    backgroundColor: "#F7F9FC",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    fontSize: 16,
    color: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#E5E9F0",
    marginBottom: 16,
  },
  button: {
    width: "100%",
    backgroundColor: "#6BBE44",
    padding: 18,
    borderRadius: 16,
    marginTop: 8,
    shadowColor: "#6BBE44",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 1,
  },
});

export default styles;
