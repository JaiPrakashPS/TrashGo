import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Toast from "react-native-toast-message";
import api from "../../api";

export default function AllottedAreas({ navigation }) {
  const [labourId, setLabourId] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [expandedAreas, setExpandedAreas] = useState({});
  const [allottedAreas, setAllottedAreas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      try {
        const storedLabourId = await AsyncStorage.getItem("labourId");
        if (storedLabourId) {
          setLabourId(storedLabourId);
          fetchAllotments(storedLabourId);
        } else {
          Toast.show({ type: "error", text1: "Please log in again" });
        }
      } catch (error) {
        console.error("Error initializing:", error);
        Toast.show({ type: "error", text1: "Failed to initialize" });
      }
    };
    initialize();
  }, []);

  const fetchAllotments = async (labourId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${api}/api/allotwork/pending/${labourId}`, {
        timeout: 5000
      });
      
      console.log("Allotments response:", response.data);
      const allotments = response.data || [];
      
      // Group areas with error handling for missing data
      const groupedAreas = allotments.reduce((acc, item) => {
        if (!item?.street) return acc; // Skip invalid entries

        const street = item.street;
        if (!acc[street]) {
          acc[street] = {
            id: street.replace(/\s/g, "-"),
            name: street,
            houses: [],
            date: item.date || new Date().toISOString(),
            time: item.time || "Not specified",
            status: item.status || "Pending",
            completed: item.status === "Collected"
          };
        }

        // Handle locationData safely
        const locationDataArray = Array.isArray(item.locationData) ? 
          item.locationData.filter(loc => loc && (loc.userId || loc.userAddress)) : [];

        locationDataArray.forEach((locData, index) => {
          if (!locData) return; // Skip if location data is null/undefined
          
          acc[street].houses.push({
            id: `${item._id}-loc${index}`,
            number: acc[street].houses.length + 1,
            status: item.status || "Pending",
            locationData: {
              userId: locData.userId || "N/A",
              userAddress: locData.userAddress || "Address not available",
              username: locData.username || "Unknown",
              todayStatus: locData.todayStatus || "NO"
            }
          });
        });
        return acc;
      }, {});

      const areasArray = Object.values(groupedAreas);
      if (areasArray.length === 0) {
        Toast.show({
          type: "info",
          text1: "No Areas Found",
          text2: "You have no areas allotted at the moment."
        });
      }
      console.log("Processed areas:", areasArray);
      setAllottedAreas(areasArray);
    } catch (error) {
      console.error("Error fetching allotments:", error.response || error);
      const errorMessage = error.response?.data?.message || error.message;
      Toast.show({ 
        type: "error", 
        text1: "Failed to fetch areas",
        text2: errorMessage
      });
      setAllottedAreas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (labourId) {
        fetchAllotments(labourId);
      }
    });
    return unsubscribe;
  }, [labourId, navigation]);

  const toggleDropdown = (areaId) => {
    setExpandedAreas((prev) => ({ ...prev, [areaId]: !prev[areaId] }));
  };

  const toggleSelectArea = (area) => {
    if (area.status === "Collected") return;
    setSelectedArea(selectedArea?.id === area.id ? null : area);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ALLOTTED AREAS</Text>
      {allottedAreas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No areas allotted</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={allottedAreas}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.areaCard,
                  selectedArea?.id === item.id && styles.selectedArea,
                  item.status === "Collected" && styles.completedArea,
                ]}
                onPress={() => toggleSelectArea(item)}
                disabled={item.status === "Collected"}
              >
                <View style={styles.areaHeader}>
                  <View style={styles.areaInfo}>
                    <Text style={[styles.areaTitle, item.status === "Collected" && styles.completedText]}>
                      {item.name.toUpperCase()}
                    </Text>
                    <Text style={[styles.dateTime, item.status === "Collected" && styles.completedText]}>
                      {new Date(item.date).toLocaleDateString()} | {item.time}
                    </Text>
                    <Text style={[styles.totalHouses, item.status === "Collected" && styles.completedText]}>
                      Total Houses: {item.houses.length}
                    </Text>
                    <Text style={[
                      styles.statusText,
                      item.status === "Collected" ? styles.collectedStatus : styles.pendingStatus
                    ]}>
                      Status: {item.status}
                    </Text>
                  </View>
                  <TouchableOpacity
                    accessible={true}
                    accessibilityLabel={`Toggle dropdown for ${item.name}`}
                    onPress={() => toggleDropdown(item.id)}
                  >
                    <Text style={styles.dropdownArrow}>{expandedAreas[item.id] ? "▲" : "▼"}</Text>
                  </TouchableOpacity>
                </View>

                {expandedAreas[item.id] && (
                  <View style={styles.houseList}>
                    {item.houses.map((house) => (
                      <View
                        key={house.id}
                        style={[styles.houseItem, house.status === "Collected" && styles.collectedHouse]}
                      >
                        <View style={styles.houseInfo}>
                          <Text style={styles.houseText}>
                            <Text style={styles.houseLabel}>House No: </Text>{house.number}
                          </Text>
                          <Text style={styles.houseText}>
                            <Text style={styles.houseLabel}>Address: </Text>{house.locationData.userAddress || "N/A"}
                          </Text>
                          <Text style={styles.houseText}>
                            <Text style={styles.houseLabel}>Username: </Text>{house.locationData.username || "N/A"}
                          </Text>
                          <Text style={styles.houseText}>
                            <Text style={styles.houseLabel}>Today Status: </Text>{house.locationData.todayStatus || "YES"}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.houseStatus,
                            house.status === "Collected" ? styles.collectedStatus : styles.pendingStatus
                          ]}
                        >
                          {house.status}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.flatListContent}
          />

          {selectedArea && selectedArea.status !== "Collected" && (
            <TouchableOpacity
              style={[styles.startTripButton, selectedArea.status === "Collected" && styles.disabledButton]}
              onPress={() =>
                navigation.navigate("tripscreen", {
                  areaId: selectedArea.id,
                  selectedAreaName: selectedArea.name,
                  totalHouses: selectedArea.houses.length,
                  houses: selectedArea.houses,
                })
              }
              disabled={selectedArea.status === "Collected"}
            >
              <Text style={styles.startTripText}>START TRIP</Text>
            </TouchableOpacity>
          )}
        </>
      )}
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F8FAFC",
    paddingTop:40,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 20,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "#4B5563",
    textAlign: "center",
    marginTop: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    color: "#6B7280",
    textAlign: "center",
    fontWeight: "500",
  },
  flatListContent: {
    paddingBottom: 80, // Ensure space for start trip button
  },
  areaCard: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedArea: {
    borderColor: "#F59E0B",
    borderWidth: 2,
  },
  completedArea: {
    backgroundColor: "#ECFDF5",
    borderLeftColor: "#10B981",
    borderLeftWidth: 4,
  },
  completedText: {
    color: "#10B981",
  },
  areaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  areaInfo: {
    flex: 1,
  },
  areaTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  dateTime: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 4,
  },
  totalHouses: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  pendingStatus: {
    color: "#EF4444",
  },
  collectedStatus: {
    color: "#10B981",
  },
  dropdownArrow: {
    fontSize: 20,
    color: "#4B5563",
    padding: 8,
  },
  houseList: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
  },
  houseItem: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  collectedHouse: {
    backgroundColor: "#ECFDF5",
  },
  houseInfo: {
    flex: 1,
  },
  houseText: {
    fontSize: 14,
    color: "#1F2937",
    marginBottom: 4,
  },
  houseLabel: {
    fontWeight: "600",
    color: "#4B5563",
  },
  houseStatus: {
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  startTripButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: "#9CA3AF",
    opacity: 0.7,
  },
  startTripText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});