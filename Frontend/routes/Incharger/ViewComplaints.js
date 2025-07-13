import React, { useEffect, useState } from "react";
import { View, Text, Image, FlatList, StyleSheet } from "react-native";

const ViewComplaints = () => {
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    const fetchComplaints = async () => {
      // Replace with actual API call
      const mockData = [
        { id: 1, name: "John Doe", location: "Area 51", image: "https://via.placeholder.com/100" },
        { id: 2, name: "Jane Smith", location: "Green Park", image: "https://via.placeholder.com/100" },
      ];
      setComplaints(mockData);
    };

    fetchComplaints();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.complaintBox}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.location}>{item.location}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Complaints</Text>
      <FlatList
        data={complaints}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8F5E9",
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#2E7D32",
  },
  complaintBox: {
    flexDirection: "row",
    backgroundColor: "#A5D6A7",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: "center",
    elevation: 3,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1B5E20",
  },
  location: {
    fontSize: 14,
    color: "#388E3C",
  },
});

export default ViewComplaints;