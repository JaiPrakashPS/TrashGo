import { StyleSheet } from "react-native";


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "50%", // Covers 50% of screen
    resizeMode: "cover",
  },
  loginBox: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#000",
    alignItems: "center",
    position: "absolute",
    top: "45%",
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "LuckiestGuy",
    color: "#000",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 15,
  },
  input: {
    width: "100%",
    backgroundColor: "#C7E98C",
    padding: 15,
    marginVertical: 8,
    borderRadius: 25,
    textAlign: "center",
    fontWeight: "bold",
    color: "#000",
  },
  button: {
    width: "100%",
    backgroundColor: "#6BBE44",
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
    marginVertical: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  registerText: {
    fontSize: 14,
    marginTop: 10,
    color: "#000",
  },
  registerLink: {
    color: "#007BFF",
    fontWeight: "bold",
  },
});

export default styles;
