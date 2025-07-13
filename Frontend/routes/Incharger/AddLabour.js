import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../api";
import axios from "axios";

const AddLabour = ({ navigation }) => {
  const [labourName, setLabourName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [labours, setLabours] = useState([]);
  const [streets, setStreets] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [inchargerId, setInchargerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [nameError, setNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  // Edit states
  const [editingLabourId, setEditingLabourId] = useState(null);
  const [editLabourName, setEditLabourName] = useState("");
  const [editPhoneNumber, setEditPhoneNumber] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editSelectedLocation, setEditSelectedLocation] = useState("");

  useEffect(() => {
    loadInchargerId();
  }, []);

  const loadInchargerId = async () => {
    try {
      const storedId = await AsyncStorage.getItem("inchargerId");
      if (storedId) {
        setInchargerId(storedId);
        fetchInchargerDetails(storedId);
      } else {
        Alert.alert("Error", "Incharger ID not found in storage!");
      }
    } catch (error) {
      console.error("Error retrieving inchargerId:", error);
      Alert.alert("Error", "Failed to retrieve Incharger ID.");
    }
  };

  const fetchInchargerDetails = async (id) => {
    try {
      const response = await axios.get(`${api}/api/inchargerDetails/get/${id}`);
      const inchargerData = response.data;
      setOfficeName(inchargerData.office);
      setStreets(inchargerData.streetNames || []);
      setSelectedLocation(inchargerData.streetNames?.[0] || "");
      fetchLabours(id);
    } catch (error) {
      console.error("Error fetching incharger details:", error);
      Alert.alert("Error", "Failed to fetch incharger details.");
    }
  };

  const fetchLabours = async (id = inchargerId) => {
    try {
      const response = await axios.get(`${api}/api/laboursByIncharger/${id}`);
      const labourData = response.data;
      setLabours(labourData);
    } catch (error) {
      console.error("Error fetching labours:", error);
      Alert.alert("Error", "Failed to fetch labours.");
    }
  };

  const validatePhone = (number) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!number) {
      setPhoneError("Phone number is required");
      return false;
    }
    if (!phoneRegex.test(number)) {
      setPhoneError("Enter a valid 10-digit number starting with 6-9");
      return false;
    }
    setPhoneError("");
    return true;
  };

  const validateName = (name) => {
    if (!name.trim()) {
      setNameError("Name is required");
      return false;
    }
    if (name.length < 3) {
      setNameError("Name must be at least 3 characters");
      return false;
    }
    setNameError("");
    return true;
  };

  const validatePassword = (pass) => {
    if (!pass) {
      setPasswordError("Password is required");
      return false;
    }
    if (pass.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const addLabour = async () => {
    const isPhoneValid = validatePhone(phoneNumber);
    const isNameValid = validateName(labourName);
    const isPasswordValid = validatePassword(password);

    if (!isPhoneValid || !isNameValid || !isPasswordValid || !selectedLocation) {
      if (!selectedLocation) {
        Alert.alert("Error", "Please select a working area");
      }
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${api}/api/addLabour/${inchargerId}`, {
        name: labourName.trim(),
        phoneNumber,
        password,
        labourWorkingArea: [selectedLocation],
      });

      Alert.alert("Success", "Labour added successfully");
      setLabourName("");
      setPhoneNumber("");
      setPassword("");
      fetchLabours();
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || "Failed to add labour";
      Alert.alert("Error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const deleteLabour = async (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this labour?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(`${api}/api/deleteLabour/${id}`);
              Alert.alert("Success", "Labour deleted successfully.");
              fetchLabours();
            } catch (error) {
              console.error("Error deleting labour:", error);
              Alert.alert("Error", "Failed to delete labour.");
            }
          },
        },
      ]
    );
  };

  const startEditing = (labour) => {
    setEditingLabourId(labour._id);
    setEditLabourName(labour.name);
    setEditPhoneNumber(labour.phoneNumber);
    setEditPassword(""); // Password is optional
    setEditSelectedLocation(labour.labourWorkingArea[0] || streets[0] || "");
  };

  const cancelEditing = () => {
    setEditingLabourId(null);
    setEditLabourName("");
    setEditPhoneNumber("");
    setEditPassword("");
    setEditSelectedLocation("");
  };

  const saveEdit = async () => {
    if (!editLabourName || !editPhoneNumber || !editSelectedLocation) {
      Alert.alert("Missing Information", "Please fill name, phone number, and working area.");
      return;
    }

    try {
      const response = await axios.put(`${api}/api/editLabour/${editingLabourId}`, {
        name: editLabourName,
        phoneNumber: editPhoneNumber,
        password: editPassword || undefined, // Send undefined if empty
        labourWorkingArea: [editSelectedLocation],
      });

      Alert.alert("Success", "Labour updated successfully.");
      cancelEditing();
      fetchLabours();
    } catch (error) {
      console.error("Error editing labour:", error.response?.data || error);
      Alert.alert("Error", error.response?.data?.error || "Failed to update labour.");
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.header}>Add Labour Details:</Text>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Name</Text>
          <TextInput
            placeholder="Enter full name"
            value={labourName}
            onChangeText={(text) => {
              setLabourName(text);
              validateName(text);
            }}
            style={[styles.input, nameError && styles.inputError]}
            placeholderTextColor="#AAB7B8"
          />
          {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <TextInput
            placeholder="Enter 10-digit phone number"
            value={phoneNumber}
            onChangeText={(text) => {
              setPhoneNumber(text);
              validatePhone(text);
            }}
            keyboardType="numeric"
            maxLength={10}
            style={[styles.input, phoneError && styles.inputError]}
            placeholderTextColor="#AAB7B8"
          />
          {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
        </View>

        <TextInput
          placeholder="Office Name"
          value={officeName}
          style={[styles.input, styles.disabledInput]}
          editable={false}
          placeholderTextColor="#AAB7B8"
        />

        <Text style={styles.subHeader}>Select Labour Working Area:</Text>
        {streets.length > 0 ? (
          <View style={[styles.pickerContainer, styles.elevatedPicker]}>
            <Picker
              selectedValue={selectedLocation}
              onValueChange={(itemValue) => setSelectedLocation(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select working area" value="" />
              {streets.map((street, index) => (
                <Picker.Item key={index} label={street} value={street} />
              ))}
            </Picker>
          </View>
        ) : (
          <Text style={styles.noDataText}>No streets available.</Text>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            placeholder="Create password (min. 6 characters)"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              validatePassword(text);
            }}
            secureTextEntry
            style={[styles.input, passwordError && styles.inputError]}
            placeholderTextColor="#AAB7B8"
          />
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        </View>

        <TouchableOpacity 
          onPress={addLabour} 
          style={[styles.addButton, loading && styles.disabledButton]}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.addButtonText}>ADD LABOUR</Text>
          )}
        </TouchableOpacity>
      </View>

      {editingLabourId && (
        <View style={styles.editContainer}>
          <Text style={styles.editHeader}>Edit Labour Details</Text>
          <TextInput
            placeholder="Name"
            value={editLabourName}
            onChangeText={setEditLabourName}
            style={styles.input}
            placeholderTextColor="#AAB7B8"
          />
          <TextInput
            placeholder="Enter Phone number"
            value={editPhoneNumber}
            onChangeText={setEditPhoneNumber}
            keyboardType="numeric"
            style={styles.input}
            placeholderTextColor="#AAB7B8"
          />
          <Text style={styles.subHeader}>Select Labour Working Area:</Text>
          {streets.length > 0 ? (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={editSelectedLocation}
                onValueChange={(itemValue) => setEditSelectedLocation(itemValue)}
                style={styles.picker}
              >
                {streets.map((street, index) => (
                  <Picker.Item key={index} label={street} value={street} />
                ))}
              </Picker>
            </View>
          ) : (
            <Text style={styles.noDataText}>No streets available.</Text>
          )}
          <TextInput
            placeholder="New Password (optional)"
            value={editPassword}
            onChangeText={setEditPassword}
            secureTextEntry
            style={styles.input}
            placeholderTextColor="#AAB7B8"
          />
          <View style={styles.editButtonContainer}>
            <TouchableOpacity
              onPress={saveEdit}
              style={[styles.addButton, styles.saveButton]}
            >
              <Text style={styles.addButtonText}>SAVE</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={cancelEditing}
              style={[styles.addButton, styles.cancelButton]}
            >
              <Text style={styles.addButtonText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Text style={styles.subHeader}>Added Labourers:</Text>

      <FlatList
        data={labours}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={styles.cardText}>Name: {item.name}</Text>
              <Text style={styles.cardText}>Phone: {item.phoneNumber}</Text>
              <Text style={styles.cardText}>
                Location: {item.labourWorkingArea?.[0] || "N/A"}
              </Text>
              <Text style={styles.cardText}>Office: {item.office}</Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity
                onPress={() => startEditing(item)}
                style={styles.actionButton}
              >
                <Ionicons name="pencil" size={24} color="#6BBE44" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => deleteLabour(item._id)}
                style={styles.actionButton}
              >
                <Ionicons name="trash" size={24} color="#E74C3C" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.noDataText}>No labours added yet.</Text>
        }
        scrollEnabled={false}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  contentContainer: {
    padding: 40,
    paddingBottom: 40,
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    fontSize: 26,
    fontWeight: "700",
    color: "#2C3E50",
    marginBottom: 20,
    textAlign: "center",
  },
  editHeader: {
    fontSize: 22,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 15,
    textAlign: "center",
  },
  subHeader: {
    fontSize: 18,
    fontWeight: "600",
    color: "#34495E",
    marginVertical: 10,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#34495E",
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E4E8",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: "#2C3E50",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  inputError: {
    borderColor: "#E74C3C",
    borderWidth: 1,
  },
  errorText: {
    color: "#E74C3C",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  disabledInput: {
    backgroundColor: "#F0F2F5",
    color: "#7F8C8D",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#E0E4E8",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  picker: {
    width: "100%",
    height: 50,
    color: "#2C3E50",
  },
  elevatedPicker: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButton: {
    backgroundColor: "#6BBE44",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButton: {
    flex: 1,
    marginRight: 8,
    backgroundColor: "#6BBE44",
  },
  cancelButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: "#E74C3C",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  editContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0E4E8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  editButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  card: {
    padding: 15,
    borderWidth: 1,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderColor: "#E0E4E8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flex: 1,
  },
  cardText: {
    fontSize: 16,
    color: "#2C3E50",
    marginBottom: 6,
    lineHeight: 22,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    marginLeft: 15,
    padding: 5,
  },
  noDataText: {
    textAlign: "center",
    color: "#E74C3C",
    fontSize: 16,
    fontStyle: "italic",
    marginVertical: 10,
  },
});

export default AddLabour;