
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import api from "../../api";

const AllotWorks = ({ navigation, route }) => {
  const { streetName = "", streets: routeStreets = [] } = route.params || {};

  const [streets, setStreets] = useState(routeStreets);
  const [selectedStreet, setSelectedStreet] = useState(
    streetName || (routeStreets.length > 0 ? routeStreets[0] : "")
  );
  const [labours, setLabours] = useState([]);
  const [selectedLabours, setSelectedLabours] = useState({});
  const [allottedStatus, setAllottedStatus] = useState({});
  const [searchLocation, setSearchLocation] = useState("");
  const [selectedDay, setSelectedDay] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedTime, setSelectedTime] = useState("6:00 AM - 7:00 AM");
  const [requestCount, setRequestCount] = useState(0);
  const [inchargerId, setInchargerId] = useState("");
  const [inchargerOffice, setInchargerOffice] = useState("");
  const [inchargerSupervisingArea, setInchargerSupervisingArea] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingCount, setIsFetchingCount] = useState(false);
  const [noLaboursMessage, setNoLaboursMessage] = useState(null);
  const [, updateState] = useState();
  const forceUpdate = useCallback(() => updateState({}), []);

  const timeSlots = [];
  for (let hour = 6; hour < 18; hour++) {
    const startHour = hour % 12 === 0 ? 12 : hour % 12;
    const endHour = (hour + 1) % 12 === 0 ? 12 : (hour + 1) % 12;
    const startTime = `${startHour}:00 ${hour < 12 ? "AM" : "PM"}`;
    const endTime = `${endHour}:00 ${hour + 1 < 12 ? "AM" : "PM"}`;
    timeSlots.push(`${startTime} - ${endTime}`);
  }

  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        setIsLoading(true);
        const storedId = await AsyncStorage.getItem("inchargerId");
        if (storedId) {
          setInchargerId(storedId);

          const storedAllottedStatus = await AsyncStorage.getItem(
            `allottedStatus_${storedId}_${selectedStreet}`
          );
          const storedSelectedLabours = await AsyncStorage.getItem(
            `selectedLabours_${storedId}_${selectedStreet}`
          );

          if (storedAllottedStatus) {
            setAllottedStatus(JSON.parse(storedAllottedStatus));
          }
          if (storedSelectedLabours) {
            setSelectedLabours(JSON.parse(storedSelectedLabours));
          }

          await fetchInchargerDetails(storedId);
          await fetchLabours(storedId);
          await fetchAllottedStatus(storedId);
        } else {
          Alert.alert("Error", "Please log in to continue", [
            {
              text: "OK",
              onPress: () => navigation.navigate("inchargerlogin"),
            },
          ]);
        }
      } catch (error) {
        console.error("Error in loadPersistedData:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPersistedData();
  }, [selectedStreet]);

  useEffect(() => {
    if (inchargerId && selectedStreet) {
      fetchAllottedStatus(inchargerId);
    }
  }, [inchargerId, selectedStreet]);

  useEffect(() => {
    if (inchargerOffice && inchargerSupervisingArea && selectedStreet) {
      fetchUserCount();
    }
  }, [inchargerOffice, inchargerSupervisingArea, selectedStreet]);

  const fetchInchargerDetails = async (id) => {
    try {
      const response = await axios.get(`${api}/api/inchargerDetails/get/${id}`, {
        timeout: 5000,
      });
      const inchargerData = response.data;
      if (inchargerData) {
        setStreets(inchargerData.streetNames || []);
        if (!selectedStreet && inchargerData.streetNames?.length > 0) {
          setSelectedStreet(inchargerData.streetNames[0]);
        }
        setInchargerOffice(inchargerData.office || "");
        setInchargerSupervisingArea(inchargerData.supervisingArea || "");
      } else {
        setStreets([]);
        setSelectedStreet("");
        setInchargerOffice("");
        setInchargerSupervisingArea("");
      }
    } catch (error) {
      console.error("Error fetching incharger details:", error.message);
      setStreets([]);
      setSelectedStreet("");
      setInchargerOffice("");
      setInchargerSupervisingArea("");
    }
  };

  const fetchLabours = async (id) => {
    if (!id) {
      setLabours([]);
      setNoLaboursMessage("No labourers available");
      return;
    }
    try {
      const response = await axios.get(`${api}/api/laboursByIncharger/${id}`, {
        timeout: 5000,
      });
      const data = response.data;
      if (Array.isArray(data)) {
        setLabours(data);
        setNoLaboursMessage(data.length === 0 ? "No labourers available" : null);
      } else {
        setLabours([]);
        setNoLaboursMessage("No labourers available");
      }
    } catch (error) {
      console.error("Error fetching labours:", error.message);
      setLabours([]);
      setNoLaboursMessage("No labourers available");
    }
  };

  const fetchUserLocations = async (labourId) => {
    try {
      const response = await axios.get(
        `${api}/api/locations/${labourId}/${selectedStreet}`,
        { timeout: 5000 }
      );
      return response.data.length > 0
        ? response.data
        : [
            {
              userId: "N/A",
              userAddress: "Address not available",
              latitude: 0.0,
              longitude: 0.0,
              username: "Unknown",
              contact: "N/A",
              todayStatus: "N/A",
            },
          ];
    } catch (error) {
      console.error(`Error fetching user locations for labourId ${labourId}:`, error.message);
      return [
        {
          userId: "N/A",
          userAddress: "Address not available",
          latitude: 0.0,
          longitude: 0.0,
          username: "Unknown",
          contact: "N/A",
          todayStatus: "N/A",
        },
      ];
    }
  };

  const fetchUserCount = async () => {
    if (!selectedStreet) {
      setRequestCount(0);
      return;
    }

    try {
      setIsFetchingCount(true);
      const response = await axios.get(
        `${api}/api/allotWork/locations/yesCount/${selectedStreet}`,
        { timeout: 5000 }
      );
      if (response.data && typeof response.data.yesUserCount !== "undefined") {
        setRequestCount(response.data.yesUserCount);
      } else {
        setRequestCount(0);
      }
    } catch (error) {
      console.error("Error fetching user count:", error.message);
      setRequestCount(0);
    } finally {
      setIsFetchingCount(false);
    }
  };

  const fetchAllottedStatus = async (id) => {
    if (!id || !selectedStreet) return;

    try {
      const response = await axios.get(`${api}/api/allotwork/pending/all`, {
        params: { street: selectedStreet, inchargerId: id },
        timeout: 5000,
      });

      const newAllottedStatus = {};
      const newSelectedLabours = {};

      if (response.data && Array.isArray(response.data)) {
        response.data.forEach((allotment) => {
          newAllottedStatus[allotment.labourId] = true;
          newSelectedLabours[allotment.labourId] = {
            _id: allotment.labourId,
            labourid: allotment.labourId,
            selected: true,
            allotted: true,
            status: allotment.status,
            day: new Date(allotment.date).toISOString().split("T")[0],
            time: allotment.time,
            street: allotment.street,
            name: allotment.labourName,
            locationData: allotment.locationData || [],
          };
        });
      }

      const storedAllottedStatus = await AsyncStorage.getItem(
        `allottedStatus_${id}_${selectedStreet}`
      );
      const storedSelectedLabours = await AsyncStorage.getItem(
        `selectedLabours_${id}_${selectedStreet}`
      );

      const mergedAllottedStatus = {
        ...(storedAllottedStatus ? JSON.parse(storedAllottedStatus) : {}),
        ...newAllottedStatus,
      };
      const mergedSelectedLabours = {
        ...(storedSelectedLabours ? JSON.parse(storedSelectedLabours) : {}),
        ...newSelectedLabours,
      };

      setAllottedStatus(mergedAllottedStatus);
      setSelectedLabours(mergedSelectedLabours);

      await AsyncStorage.setItem(
        `allottedStatus_${id}_${selectedStreet}`,
        JSON.stringify(mergedAllottedStatus)
      );
      await AsyncStorage.setItem(
        `selectedLabours_${id}_${selectedStreet}`,
        JSON.stringify(mergedSelectedLabours)
      );

      if (Object.keys(mergedAllottedStatus).length === 0) {
        setNoLaboursMessage("No allotted work available");
      }
    } catch (error) {
      console.error("Error fetching allotted status:", error.message);
      const storedAllottedStatus = await AsyncStorage.getItem(
        `allottedStatus_${id}_${selectedStreet}`
      );
      const storedSelectedLabours = await AsyncStorage.getItem(
        `selectedLabours_${id}_${selectedStreet}`
      );

      if (storedAllottedStatus) {
        setAllottedStatus(JSON.parse(storedAllottedStatus));
      } else {
        setAllottedStatus({});
      }
      if (storedSelectedLabours) {
        setSelectedLabours(JSON.parse(storedSelectedLabours));
      } else {
        setSelectedLabours({});
      }

      setNoLaboursMessage("No allotted work available");
    }
  };
  const toggleLabourSelection = async (labour) => {
    const isAllotted = allottedStatus[labour.labourid];
  
    if (isAllotted) {
      Alert.alert(
        "Remove Labour",
        `Are you sure you want to remove ${labour.name}'s allotted work?`,
        [
          { text: "NO", style: "cancel" },
          {
            text: "YES",
            onPress: async () => {
              try {
                const labourData = selectedLabours[labour._id];
                const date = labourData?.day || selectedDay;
  
                // Normalize date to match database format
                const normalizedDate = date.endsWith("Z")
                  ? date
                  : `${date}T00:00:00.000Z`;
  
                // Use labourId from selectedLabours to ensure it matches AllotWork
                const labourIdToRemove = labourData?.labourid || labour.labourid;
  
                // Debug labourId
                console.log("Labour details for DELETE:", {
                  labourId: labour.labourid,
                  labour_id: labour._id,
                  labourName: labour.name,
                  selectedLaboursLabourId: labourData?.labourid,
                  selectedLaboursId: labourData?._id,
                  labourIdToRemove,
                });
  
                console.log("Sending DELETE request:", {
                  inchargerId,
                  labourId: labourIdToRemove,
                  street: selectedStreet,
                  date: normalizedDate,
                });
  
                const response = await axios.delete(
                  `${api}/api/allotWork/remove/${inchargerId}/${labourIdToRemove}`,
                  {
                    params: {
                      street: selectedStreet,
                      date: normalizedDate,
                    },
                    timeout: 5000,
                  }
                );
  
                const updatedAllottedStatus = { ...allottedStatus };
                delete updatedAllottedStatus[labour.labourid];
                setAllottedStatus(updatedAllottedStatus);
  
                const updatedSelectedLabours = { ...selectedLabours };
                delete updatedSelectedLabours[labour._id];
                setSelectedLabours(updatedSelectedLabours);
  
                await AsyncStorage.setItem(
                  `allottedStatus_${inchargerId}_${selectedStreet}`,
                  JSON.stringify(updatedAllottedStatus)
                );
                await AsyncStorage.setItem(
                  `selectedLabours_${inchargerId}_${selectedStreet}`,
                  JSON.stringify(updatedSelectedLabours)
                );
  
                Alert.alert(
                  "Success",
                  response.data.message || "Allotted work removed successfully"
                );
                forceUpdate();
              } catch (error) {
                console.error("Error removing work:", error.message);
                const updatedAllottedStatus = { ...allottedStatus };
                delete updatedAllottedStatus[labour.labourid];
                setAllottedStatus(updatedAllottedStatus);
  
                const updatedSelectedLabours = { ...selectedLabours };
                delete updatedSelectedLabours[labour._id];
                setSelectedLabours(updatedSelectedLabours);
  
                await AsyncStorage.setItem(
                  `allottedStatus_${inchargerId}_${selectedStreet}`,
                  JSON.stringify(updatedAllottedStatus)
                );
                await AsyncStorage.setItem(
                  `selectedLabours_${inchargerId}_${selectedStreet}`,
                  JSON.stringify(updatedSelectedLabours)
                );
  
                // Handle error messages for the screen
                let errorMessage = "Failed to remove work";
                if (error.response) {
                  if (error.response.status === 400) {
                    errorMessage = error.response.data.error || "Invalid request parameters";
                  } else if (error.response.status === 200 && error.response.data.message === "No work to remove") {
                    errorMessage = "Work already removed or does not exist";
                  } else {
                    errorMessage = error.response.data.message || error.message;
                  }
                }
  
                Alert.alert("Success", errorMessage);
                forceUpdate();
              }
            },
          },
        ]
      );
    } else {
      if (!selectedStreet || !selectedDay || !selectedTime) {
        Alert.alert("Error", "Please select street, day, and time");
        return;
      }
  
      try {
        const locationData = await fetchUserLocations(labour.labourid);
        const newLabourData = {
          _id: labour._id,
          labourid: labour.labourid,
          selected: true,
          allotted: false,
          status: "Pending",
          day: selectedDay,
          time: selectedTime,
          street: selectedStreet,
          name: labour.name,
          locationData,
        };
  
        const response = await axios.post(
          `${api}/api/allotWork/allotwork/${inchargerId}`,
          {
            labourid: labour._id || labour.labourid,
            street: selectedStreet,
            date: new Date(selectedDay).toISOString(),
            time: selectedTime,
            status: "Pending",
            locationData,
          },
          {
            headers: { "Content-Type": "application/json" },
            timeout: 5000,
          }
        );
  
        if (response.status === 201) {
          const updatedAllottedStatus = {
            ...allottedStatus,
            [labour.labourid]: true,
          };
          const updatedSelectedLabours = {
            ...selectedLabours,
            [labour._id]: { ...newLabourData, allotted: true },
          };
  
          setAllottedStatus(updatedAllottedStatus);
          setSelectedLabours(updatedSelectedLabours);
  
          await AsyncStorage.setItem(
            `allottedStatus_${inchargerId}_${selectedStreet}`,
            JSON.stringify(updatedAllottedStatus)
          );
          await AsyncStorage.setItem(
            `selectedLabours_${inchargerId}_${selectedStreet}`,
            JSON.stringify(updatedSelectedLabours)
          );
  
          Alert.alert("Success", "Work allotted successfully");
          forceUpdate();
        }
      } catch (error) {
        console.error("Error allotting work:", error);
        let errorMessage = "Failed to allot work";
  
        if (error.response) {
          if (error.response.status === 400) {
            if (error.response.data.errors) {
              errorMessage = error.response.data.errors.join("\n");
            } else if (
              error.response.data.message ===
              "Labour already allotted for this date and time"
            ) {
              const existingWork = error.response.data.existingWork;
              errorMessage = `Labour is already allotted to ${existingWork.street} on ${existingWork.date} at ${existingWork.time}`;
            } else {
              errorMessage = error.response.data.message;
            }
          } else if (error.response.status === 404) {
            errorMessage = error.response.data.message || "Labour or incharger not found";
          } else {
            errorMessage = error.response.data.message || error.message;
          }
        }
  
        Alert.alert("Error", errorMessage);
      }
    }
  };
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem(`selectedLabours_${inchargerId}`);
      await AsyncStorage.removeItem(`allottedStatus_${inchargerId}_${selectedStreet}`);
      await AsyncStorage.removeItem(`selectedLabours_${inchargerId}_${selectedStreet}`);
      await AsyncStorage.removeItem("inchargerId");
      setSelectedLabours({});
      setAllottedStatus({});
      setInchargerId("");
      navigation.navigate("Login");
    } catch (error) {
      console.error("Error during logout:", error);
      Alert.alert("Error", "Failed to log out");
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "yes":
        return "#4CAF50";
      case "pending":
      case "pendingacknowledgment":
        return "#FF9800";
      case "collected":
        return "#2196F3";
      case "off":
        return "#E74C3C";
      default:
        return "#6B7280";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "collected":
        return "checkmark-circle";
      case "pending":
        return "hourglass";
      case "pendingacknowledgment":
        return "time";
      default:
        return "help-circle";
    }
  };

  const handleInchargerVerification = async (allotmentId, locationData) => {
    try {
      const response = await axios.put(
        `${api}/api/allotWork/confirm/${allotmentId}`,
        {
          userId: locationData.userId,
        },
        { timeout: 5000 }
      );

      if (response.data.success) {
        await fetchAllottedStatus(inchargerId);
        Alert.alert("Success", "Collection verified successfully");

        if (response.data.status === "PendingAcknowledgment") {
          Alert.alert(
            "Status Update",
            "All collections have been verified. The status will be updated to Collected after final confirmation.",
            [
              {
                text: "OK",
                onPress: () => {
                  fetchAllottedStatus(inchargerId);
                },
              },
            ]
          );
        }
      }
    } catch (error) {
      console.error("Error verifying collection:", error);
      Alert.alert("Error", "Failed to verify collection");
    }
  };

  const filteredLabours = searchLocation
    ? labours.filter(
        (labour) =>
          labour.labourWorkingArea.includes(selectedStreet) &&
          (labour.labourWorkingArea.some((area) =>
            area.toLowerCase().includes(searchLocation.toLowerCase())
          ) ||
            labour.name.toLowerCase().includes(searchLocation.toLowerCase()) ||
            labour.phoneNumber.includes(searchLocation))
      )
    : labours.filter((labour) =>
        labour.labourWorkingArea.includes(selectedStreet)
      );

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerIcon}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Allot Works</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("InchargerProfile")}
          style={styles.headerIcon}
          activeOpacity={0.7}
        >
          <Ionicons name="person-circle" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Street</Text>
        {isLoading ? (
          <Text style={styles.noDataText}>Loading...</Text>
        ) : streets.length > 0 ? (
          <View>
            <Picker
              selectedValue={selectedStreet}
              onValueChange={(itemValue) => setSelectedStreet(itemValue)}
              style={styles.picker}
            >
              {streets.map((street, index) => (
                <Picker.Item key={index} label={street} value={street} />
              ))}
            </Picker>
            <TouchableOpacity
              style={[
                styles.requestCountButton,
                isFetchingCount && styles.requestCountButtonDisabled,
              ]}
              onPress={fetchUserCount}
              disabled={isFetchingCount}
              activeOpacity={0.7}
            >
              <Text style={styles.requestCountText}>
                {isFetchingCount ? "Fetching..." : `Requests: ${requestCount}`}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style= {styles.noDataText}>No streets available</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Day</Text>
        <TextInput
          style={styles.input}
          value={selectedDay}
          onChangeText={setSelectedDay}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Time</Text>
        <Picker
          selectedValue={selectedTime}
          onValueChange={setSelectedTime}
          style={styles.picker}
        >
          {timeSlots.map((time, index) => (
            <Picker.Item key={index} label={time} value={time} />
          ))}
        </Picker>
      </View>

      <View style={styles.section}>
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search by name, phone, or location"
            value={searchLocation}
            onChangeText={setSearchLocation}
            style={styles.searchInput}
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity
            onPress={() => setSearchLocation("")}
            style={styles.searchIcon}
            activeOpacity={0.7}
          >
            <Ionicons name="search" size={20} color="#6BBE44" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Labourers</Text>
        {isLoading ? (
          <Text style={styles.noDataText}>Loading...</Text>
        ) : filteredLabours.length === 0 ? (
          <Text style={styles.noDataText}>
            {noLaboursMessage || "No labourers available"}
          </Text>
        ) : null}
      </View>
    </>
  );

  const renderLabourItem = ({ item }) => {
    const labourData = selectedLabours[item._id];
    const isAllotted = allottedStatus[item.labourid];

    return (
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>
            <Ionicons name="person" size={18} color="#1F2937" /> {item.name}
          </Text>
          <Text style={styles.cardText}>
            <Ionicons name="call" size={16} color="#1F2937" /> {item.phoneNumber}
          </Text>
          <Text style={styles.cardText}>
            <Ionicons name="location" size={16} color="#1F2937" />{" "}
            {item.labourWorkingArea?.join(", ") || "N/A"}
          </Text>

          {isAllotted && labourData && (
            <View style={styles.cardDetails}>
              <Text style={styles.cardText}>
                <Ionicons name="calendar" size={16} color="#1F2937" />{" "}
                {labourData.day}
              </Text>
              <Text style={styles.cardText}>
                <Ionicons name="time" size={16} color="#1F2937" />{" "}
                {labourData.time}
              </Text>
              <Text
                style={[
                  styles.cardText,
                  {
                    color: getStatusColor(labourData.status),
                    fontWeight: "600",
                  },
                ]}
              >
                <Ionicons
                  name={getStatusIcon(labourData.status)}
                  size={16}
                  color={getStatusColor(labourData.status)}
                />{" "}
                Status: {labourData.status}
              </Text>

              {labourData.locationData && labourData.locationData.length > 0 ? (
                labourData.locationData.map((loc, index) => (
                  <View key={index} style={styles.locationContainer}>
                    <Text style={styles.cardText}>
                      <Ionicons name="person-outline" size={16} color="#1F2937" />{" "}
                      {loc.username || "Unknown"}
                    </Text>
                    <Text style={styles.cardText}>
                      <Ionicons name="home" size={16} color="#1F2937" />{" "}
                      {loc.userAddress || "Address not available"}
                    </Text>
                    <Text style={styles.cardText}>
                      <Ionicons name="call-outline" size={16} color="#1F2937" />{" "}
                      {loc.contact || "N/A"}
                    </Text>
                    <Text
                      style={[
                        styles.cardText,
                        {
                          color: loc.todayStatus === "NO" ? "#4CAF50" : "#FF9800",
                        },
                      ]}
                    >
                      <Ionicons
                        name={loc.todayStatus === "NO" ? "checkmark-circle" : "time"}
                        size={16}
                        color={loc.todayStatus === "NO" ? "#4CAF50" : "#FF9800"}
                      />{" "}
                      Today Status: {loc.todayStatus}
                    </Text>
                    {(loc.todayStatus === "YES" || !loc.acknowledgedAt) && (
                      <TouchableOpacity
                        style={styles.verifyButton}
                        onPress={() => handleInchargerVerification(labourData._id, loc)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.verifyButtonText}>Verify Collection</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.cardText}>No location data available</Text>
              )}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.actionButton,
            isAllotted && styles.actionButtonRemove,
          ]}
          onPress={() => toggleLabourSelection(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.actionButtonText}>
            {isAllotted ? "Remove Work" : "Allot Work"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <FlatList
      style={styles.container}
      data={filteredLabours}
      keyExtractor={(item) => item._id}
      extraData={{ selectedLabours, allottedStatus }}
      renderItem={renderLabourItem}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={
        filteredLabours.length === 0 && !isLoading ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="alert-circle-outline" size={60} color="#9CA3AF" />
            <Text style={styles.noDataText}>
              {noLaboursMessage || "No labourers available"}
            </Text>
          </View>
        ) : null
      }
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#6BBE44",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginTop: Platform.OS === "ios" ? 40 : 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  headerIcon: {
    padding: 8,
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  picker: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#1F2937",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#1F2937",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1F2937",
  },
  searchIcon: {
    padding: 8,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 6,
    lineHeight: 20,
  },
  cardDetails: {
    marginTop: 8,
  },
  locationContainer: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    borderLeftWidth: 3,
    borderLeftColor: "#6BBE44",
  },
  actionButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "#6BBE44",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  actionButtonRemove: {
    backgroundColor: "#E74C3C",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  noDataText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 16,
    fontWeight: "500",
  },
  requestCountButton: {
    backgroundColor: "#6BBE44",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  requestCountButtonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.7,
  },
  requestCountText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
  },
  verifyButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: "flex-start",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  verifyButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default AllotWorks;