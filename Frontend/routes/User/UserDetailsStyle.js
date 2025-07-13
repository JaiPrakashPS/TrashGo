import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  headerText: {
    width: "100%",
    backgroundColor: "#B2E281",
    padding: 12,
    borderRadius: 5,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 15,
  },
  input: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: "#000",
    backgroundColor: "#fff",
    marginBottom: 10,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  pickerContainer: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 5,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: "bold",
    padding: 8,
    color: "#000",
  },
  picker: {
    width: "100%",
    height: 50,
  },
  coordRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  coordCol: {
    flexDirection: "column",
  },
  coordText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  resetButton: {
    backgroundColor: "#FFA07A",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  resetText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
  submitButton: {
    width: "100%",
    backgroundColor: "#87CEEB",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  showMapButton: {
    width: "100%",
    backgroundColor: "#4682B4",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  map: {
    width: "100%",
    height: 250,
    borderRadius: 10,
    marginBottom: 20,
  },
});

export default styles;
