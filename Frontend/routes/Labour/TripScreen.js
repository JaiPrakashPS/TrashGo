import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
} from "react-native";
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from "react-native-maps";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import api from "../../api";

export default function TripScreen({ route, navigation }) {
  const [allotments, setAllotments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [labourId, setLabourId] = useState(null);
  const [recycledLocations, setRecycledLocations] = useState([]);
  const [region, setRegion] = useState({
    latitude: 20.5937,
    longitude: 78.9629,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    const loadLabourId = async () => {
      try {
        const id = await AsyncStorage.getItem("labourId");
        if (id) {
          setLabourId(id);
          await fetchAllotments(id);
        } else {
          setError("Labour ID not found. Please login again.");
          Alert.alert("Error", "Labour ID not found. Please login again.");
        }
      } catch (error) {
        console.error("Error loading labour ID:", error);
        setError("Failed to load labour information");
        Alert.alert("Error", "Failed to load labour information");
      }
    };
    loadLabourId();
  }, []);

  const fetchAllotments = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(`${api}/api/allotWork/pending/${id}`, { timeout: 5000 });
      console.log("Allotments response:", response.data);
      if (response.data && Array.isArray(response.data)) {
        setAllotments(response.data);
        if (response.data[0]?.locationData?.[0]) {
          const firstLocation = response.data[0].locationData[0];
          if (firstLocation.latitude && firstLocation.longitude) {
            setRegion({
              latitude: firstLocation.latitude,
              longitude: firstLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          }
        }
      } else {
        setAllotments([]);
      }
    } catch (error) {
      console.error("Error fetching allotments:", error);
      const errorMsg = error.response?.data?.message || "Failed to fetch allotted work";
      setError(errorMsg);
      Alert.alert("Error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCollectionComplete = async (allotmentId, userId) => {
    if (!allotmentId || !userId || !labourId) {
      Alert.alert("Error", "Invalid allotment, user, or labour ID");
      return;
    }
    Alert.alert(
      "Confirm Collection",
      "Was the garbage collected from this location?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              setLoading(true);
              const response = await axios.put(
                `${api}/api/labour/update/${labourId}`,
                {
                  allotmentId,
                  userId,
                  collected: true,
                },
                { 
                  timeout: 15000,
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  validateStatus: (status) => status < 500
                }
              );

              if (response.data.success) {
                Alert.alert(
                  "Success", 
                  "Collection marked successfully. Waiting for user confirmation.",
                  [
                    {
                      text: "OK",
                      onPress: async () => {
                        await fetchAllotments(labourId);
                      }
                    }
                  ]
                );
              } else {
                throw new Error(response.data.message || "Failed to update collection");
              }
            } catch (error) {
              console.error("Error updating collection status:", error);
              const errorMessage = error.response?.data?.message 
                || error.message 
                || "Network error. Please check your connection and try again.";
              Alert.alert(
                "Error", 
                `Failed to update collection: ${errorMessage}`
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleMarkRecycled = async (userId) => {
    if (!userId) {
      Alert.alert("Error", "Invalid user ID");
      return;
    }
    Alert.alert(
      "Confirm Recycling",
      "Was the garbage recycled for this user?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              setLoading(true);
              const response = await axios.post(`${api}/api/user-points/add/${userId}`, {}, {
                timeout: 5000,
                headers: { 'Content-Type': 'application/json' },
              });

              if (response.data.success) {
                setRecycledLocations((prev) => [...prev, userId]);
                Alert.alert(
                  "Success",
                  `Recycling marked! User points updated: ${response.data.points}`,
                  [{ text: "OK" }]
                );
              } else {
                throw new Error(response.data.message || "Failed to add points");
              }
            } catch (error) {
              console.error("Error adding recycling points:", error);
              const errorMessage = error.response?.data?.message || error.message;
              Alert.alert("Error", `Failed to add recycling points: ${errorMessage}`);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleMarkAllCollected = async (allotment) => {
    if (!allotment?._id || !labourId) {
      Alert.alert("Error", "Invalid allotment or labour ID");
      return;
    }
    Alert.alert(
      "Confirm All Collections",
      "Are you sure you want to mark all locations as collected?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              setLoading(true);
              const response = await axios.put(
                `${api}/api/labour/update/${labourId}`,
                {
                  allotmentId: allotment._id,
                  markAll: true,
                  collected: true,
                },
                { timeout: 5000 }
              );

              if (response.data.success) {
                Alert.alert("Success", response.data.message || "All collections marked successfully");
                await fetchAllotments(labourId);
              } else {
                throw new Error(response.data.message || "Failed to update collections");
              }
            } catch (error) {
              console.error("Error marking all collections:", error);
              const errorMsg = error.response?.data?.message || error.message;
              Alert.alert("Error", `Failed to update collections: ${errorMsg}`);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderLocationItem = ({ item: location, allotment }) => (
    <View style={styles.locationCard}>
      <View style={styles.locationInfo}>
        <View style={styles.locationHeader}>
          <Ionicons name="person" size={18} color="#4A90E2" />
          <Text style={styles.locationUsername}>{location.username || "Unknown"}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(location.todayStatus, 0.2) }
          ]}>
            <Text style={[
              styles.statusText,
              { color: getStatusColor(location.todayStatus) }
            ]}>
              {location.todayStatus || "N/A"}
            </Text>
          </View>
        </View>
        
        <View style={styles.addressRow}>
          <Ionicons name="home" size={16} color="#4A90E2" />
          <Text style={styles.addressText} numberOfLines={2}>
            {location.userAddress || "No address"}
          </Text>
        </View>
        
        {location.labourCollected && (
          <View style={styles.statusRow}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={[styles.statusIndicator, { color: "#4CAF50" }]}>
              Marked as Collected
            </Text>
          </View>
        )}
        
        {location.collectionConfirmed && (
          <View style={styles.statusRow}>
            <Ionicons name="checkmark-done" size={16} color="#2196F3" />
            <Text style={[styles.statusIndicator, { color: "#2196F3" }]}>
              User Confirmed
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.buttonContainer}>
        {location.todayStatus === "YES" && !location.labourCollected && (
          <TouchableOpacity
            style={styles.collectionButton}
            onPress={() => handleCollectionComplete(allotment._id, location.userId)}
          >
            <Ionicons name="checkmark-circle" size={16} color="#FFF" />
            <Text style={styles.buttonText}>Collect</Text>
          </TouchableOpacity>
        )}
        {location.todayStatus === "YES" && !recycledLocations.includes(location.userId) && (
          <TouchableOpacity
            style={styles.recycleButton}
            onPress={() => handleMarkRecycled(location.userId)}
          >
            <Ionicons name="refresh" size={16} color="#FFF" />
            <Text style={styles.buttonText}>Recycle</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const getStatusColor = (status, opacity = 1) => {
    let color;
    switch (status?.toUpperCase()) {
      case "YES":
        color = "rgb(76, 175, 80)"; // Green
        break;
      case "PENDING":
        color = "rgb(255, 160, 0)"; // Amber
        break;
      case "COLLECTED":
        color = "rgb(33, 150, 243)"; // Blue
        break;
      case "NO":
        color = "rgb(255, 87, 34)"; // Deep Orange
        break;
      default:
        color = "rgb(255, 87, 34)"; // Deep Orange
    }
    
    // If opacity is provided, convert to rgba
    if (opacity < 1) {
      color = color.replace("rgb", "rgba").replace(")", `, ${opacity})`);
    }
    
    return color;
  };

  const renderAllotmentItem = ({ item }) => (
    <View style={styles.allotmentCard}>
      <View style={styles.allotmentHeader}>
        <View style={styles.streetContainer}>
          <Ionicons name="location" size={20} color="#3498db" />
          <Text style={styles.streetName}>{item.street}</Text>
        </View>
        <View style={styles.timeContainer}>
          <Ionicons name="time" size={18} color="#7F8C8D" />
          <Text style={styles.allotmentTime}>{item.time}</Text>
        </View>
      </View>

      {item.locationData && item.locationData.length > 0 ? (
        <>
          <FlatList
            data={item.locationData}
            renderItem={({ item: location }) => renderLocationItem({ item: location, allotment: item })}
            keyExtractor={(location, index) => location.userId || index.toString()}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            scrollEnabled={false}
          />
          
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={() => handleMarkAllCollected(item)}
          >
            <Ionicons name="checkmark-done-circle" size={20} color="#FFF" />
            <Text style={styles.markAllText}>Mark All as Collected</Text>
          </TouchableOpacity>
          
          {item.status === "Pending Confirmation" && (
            <View style={styles.statusIndicatorContainer}>
              <Ionicons name="hourglass" size={16} color="#FF9800" />
              <Text style={styles.pendingText}>Awaiting user confirmation</Text>
            </View>
          )}
          
          {item.status === "Collected" && (
            <View style={styles.statusIndicatorContainer}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.collectedText}>Collection confirmed</Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={24} color="#95A5A6" />
          <Text style={styles.noLocationsText}>No locations assigned</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading trip details...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
        <Ionicons name="alert-circle" size={60} color="#E74C3C" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchAllotments(labourId)}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trip Details</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={() => fetchAllotments(labourId)}
        >
          <Ionicons name="refresh" size={24} color="#3498db" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
        >
          {allotments.map((allotment) =>
            (allotment.locationData || []).map((location, index) => {
              if (location.latitude && location.longitude) {
                return (
                  <Marker
                    key={`${allotment._id}-${index}`}
                    coordinate={{
                      latitude: location.latitude,
                      longitude: location.longitude,
                    }}
                    pinColor={location.todayStatus === "YES" ? "#FF5252" : "#4CAF50"}
                  >
                    <Callout tooltip>
                      <View style={styles.calloutContainer}>
                        <Text style={styles.calloutTitle}>{location.username}</Text>
                        <Text style={styles.calloutAddress}>{location.userAddress}</Text>
                        <View style={[
                          styles.calloutStatus,
                          { backgroundColor: getStatusColor(location.todayStatus, 0.2) }
                        ]}>
                          <Text style={[
                            styles.calloutStatusText,
                            { color: getStatusColor(location.todayStatus) }
                          ]}>
                            {location.todayStatus}
                          </Text>
                        </View>
                      </View>
                    </Callout>
                  </Marker>
                );
              }
              return null;
            })
          )}
        </MapView>
        <View style={styles.mapLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#FF5252" }]} />
            <Text style={styles.legendText}>Garbage - Yes</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#4CAF50" }]} />
            <Text style={styles.legendText}>Collected/No</Text>
          </View>
        </View>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Collection Locations</Text>
        <FlatList
          data={allotments}
          renderItem={renderAllotmentItem}
          keyExtractor={(item) => item._id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginTop: 30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  refreshButton: {
    padding: 8,
  },
  mapContainer: {
    height: Dimensions.get("window").height * 0.35,
    width: "100%",
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapLegend: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#2C3E50',
  },
  listContainer: {
    flex: 1,
    paddingTop: 10,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    paddingHorizontal: 15,
    marginBottom: 5,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 15,
    paddingTop: 5,
  },
  allotmentCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  allotmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  streetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streetName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginLeft: 6,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  allotmentTime: {
    fontSize: 14,
    color: "#7F8C8D",
    marginLeft: 4,
  },
  locationCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: "#34495E",
    marginLeft: 6,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  addressText: {
    fontSize: 14,
    color: "#34495E",
    marginLeft: 6,
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusIndicator: {
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: 'center',
    gap: 8,
  },
  collectionButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recycleButton: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 4,
  },
  separator: {
    height: 1,
    backgroundColor: "#EEE",
    marginVertical: 8,
  },
  markAllButton: {
    backgroundColor: "#3498db",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: 'row',
  },
  markAllText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  statusIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  pendingText: {
    textAlign: "center",
    fontSize: 14,
    color: "#FF9800",
    marginLeft: 6,
    fontWeight: '500',
  },
  collectedText: {
    textAlign: "center",
    fontSize: 14,
    color: "#4CAF50",
    marginLeft: 6,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  noLocationsText: {
    textAlign: "center",
    color: "#95A5A6",
    fontSize: 16,
    marginTop: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    fontSize: 16,
    color: "#7F8C8D",
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#F5F5F5",
    padding: 20,
  },
  errorText: {
    textAlign: "center",
    fontSize: 16,
    color: "#E74C3C",
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#3498db",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  calloutContainer: {
    width: 200,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
    color: '#2C3E50',
  },
  calloutAddress: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 6,
  },
  calloutStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  calloutStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});