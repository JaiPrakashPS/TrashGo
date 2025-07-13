import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import api from "../../api"; // Adjust the import path as necessary

const InchargerDetails = ({ navigation }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    area: "",
    office: "Corporation",
  });
  const [extraFields, setExtraFields] = useState([""]);

  const handleInputChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleExtraFieldChange = (index, value) => {
    const newFields = [...extraFields];
    newFields[index] = value;
    setExtraFields(newFields);
  };

  const addExtraField = () => {
    setExtraFields([...extraFields, ""]);
  };

  const removeExtraField = () => {
    if (extraFields.length > 1) {
      setExtraFields(extraFields.slice(0, -1));
    }
  };

  // Function to handle form submission and API call
  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.phone || !form.area || !form.office) {
      Alert.alert("Missing Details", "Please fill all fields before proceeding.");
      return;
    }

    const filteredStreets = extraFields.filter(
      (street) => street.trim() !== ""
    );

    const inchargerData = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      office: form.office,
      supervisingArea: form.area,
      streetNames: filteredStreets,
    };

    try {
      console.log("API URL:", `${api}/api/inchargerDetails/add-incharger`);
      const response = await fetch(`${api}/api/inchargerDetails/add-incharger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inchargerData),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", "Incharger details added successfully");

        navigation.navigate("InchargerHomePage", {
          inchargerId: data.inchargerId, // Assuming API returns this
          ...form,
          extraFields,
        });
      } else {
        Alert.alert("Error", data.error || "Failed to save incharger details");
      }
    } catch (error) {
      console.error("Error submitting incharger details:", error);
      Alert.alert("Error", "An error occurred while submitting the form.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.header}>ENTER YOUR DETAILS:</Text>

        <TextInput
          style={styles.input}
          placeholder="Name"
          value={form.name}
          onChangeText={(text) => handleInputChange("name", text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          keyboardType="email-address"
          value={form.email}
          onChangeText={(text) => handleInputChange("email", text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Enter Phone number"
          keyboardType="phone-pad"
          value={form.phone}
          onChangeText={(text) => handleInputChange("phone", text)}
        />

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={form.office}
            onValueChange={(itemValue) => handleInputChange("office", itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Select Your Office" value="" color="gray" />
            <Picker.Item label="Corporation" value="Corporation" />
            <Picker.Item label="Village Panchayat" value="Village Panchayat" />
            <Picker.Item label="Town Panchayat" value="Town Panchayat" />
            <Picker.Item label="City" value="City" />
          </Picker>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Enter your supervising area"
          value={form.area}
          onChangeText={(text) => handleInputChange("area", text)}
        />

        <Text style={styles.subHeader}>ADD A STREET</Text>
        {extraFields.map((field, index) => (
          <View key={index} style={styles.dynamicFieldContainer}>
            <TextInput
              style={styles.dynamicInput}
              placeholder={`ADD STREET ${index + 1}`}
              value={field}
              onChangeText={(text) => handleExtraFieldChange(index, text)}
            />
            {index === 0 && (
              <View style={styles.iconContainer}>
                <TouchableOpacity onPress={addExtraField} style={styles.iconButton}>
                  <Ionicons name="add-circle" size={30} color="#2ECC71" />
                </TouchableOpacity>
                <TouchableOpacity onPress={removeExtraField} style={styles.iconButton}>
                  <Ionicons name="remove-circle" size={30} color="#E74C3C" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>SUBMIT</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1 },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#2ECC71",
    fontSize: 18,
    fontWeight: "bold",
    padding: 10,
    textAlign: "center",
    width: "100%",
  },
  subHeader: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 5,
  },
  input: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#000",
    marginVertical: 8,
    borderRadius: 5,
    fontSize: 16,
  },
  pickerContainer: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 5,
    marginVertical: 8,
    backgroundColor: "#fff",
  },
  picker: {
    width: "100%",
    padding: 4,
  },
  dynamicFieldContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 5,
  },
  dynamicInput: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 5,
    fontSize: 16,
  },
  iconContainer: {
    flexDirection: "row",
    marginLeft: 10,
  },
  iconButton: {
    marginHorizontal: 5,
  },
  submitButton: {
    backgroundColor: "#2ECC71",
    padding: 12,
    marginTop: 10,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
  },
  submitText: {
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default InchargerDetails;
