import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import api from "../../api";
import styles from "./UserHomePageStyle";

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "yes":
      return "#36B37E";
    case "pending":
    case "pendingacknowledgment":
      return "#FFA000";
    case "collected":
      return "#0288D1";
    case "off":
      return "#F05545";
    default:
      return "#757575";
  }
};

const getStatusMessage = (status) => {
  switch (status?.toLowerCase()) {
    case "yes":
      return "Ready for Collection";
    case "pending":
      return "Pending Collection";
    case "pendingacknowledgment":
      return "Awaiting Verification";
    case "collected":
      return "Collection Complete";
    case "off":
      return "Collection Inactive";
    default:
      return "Unknown Status";
  }
};

// Define customStyles for NotificationModal
const customStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    width: "80%",
    maxWidth: 400,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginLeft: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: "#4B5563",
    lineHeight: 24,
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: "#36B37E",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: "flex-end",
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});

// Reusable Notification Modal Component
const NotificationModal = ({ visible, title, message, onClose, buttonText = "OK" }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={customStyles.modalOverlay}>
        <Animated.View
          style={[
            customStyles.modalContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={customStyles.modalHeader}>
            <Ionicons name="information-circle" size={32} color="#36B37E" />
            <Text style={customStyles.modalTitle}>{title}</Text>
          </View>
          <Text style={customStyles.modalMessage}>{message}</Text>
          <TouchableOpacity
            style={customStyles.modalButton}
            onPress={onClose}
          >
            <Text style={customStyles.modalButtonText}>{buttonText}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const UserHomePage = ({ navigation }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [isMarked, setIsMarked] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userStreet, setUserStreet] = useState("");
  const [allottedWork, setAllottedWork] = useState(null);
  const [acknowledging, setAcknowledging] = useState(false);
  const [todayStatus, setTodayStatus] = useState(null);
  const [currentAllotmentId, setCurrentAllotmentId] = useState(null);
  const [userAllotments, setUserAllotments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0); // State for points
  const [notification, setNotification] = useState({
    visible: false,
    title: "",
    message: "",
    buttonText: "OK",
    onClose: () => {},
  });
  const slideAnim = useRef(new Animated.Value(-250)).current;

  const showNotification = (title, message, buttonText = "OK", onClose = () => {}) => {
    setNotification({
      visible: true,
      title,
      message,
      buttonText,
      onClose: () => {
        setNotification((prev) => ({ ...prev, visible: false }));
        onClose();
      },
    });
  };

  const fetchPoints = async (userId) => {
    try {
      const response = await axios.get(`${api}/api/user-points/${userId}`, {
        timeout: 5000,
        headers: { "Content-Type": "application/json" },
      });
      setPoints(response.data.points);
    } catch (error) {
      console.error("Error fetching points:", error);
      showNotification("Error", "Failed to load points. Please try again.");
    }
  };

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        setLoading(true);
        const storedUserId = await AsyncStorage.getItem("userId");
        const storedStreet = await AsyncStorage.getItem("userStreet");
        const storedInchargerId = await AsyncStorage.getItem("userInchargerId");
        console.log("Loaded from AsyncStorage - userId:", storedUserId, "street:", storedStreet, "inchargerId:", storedInchargerId);

        if (storedUserId && storedStreet) {
          setUserId(storedUserId);
          setUserStreet(storedStreet);
          await fetchTodayStatus(storedUserId);
          await fetchAllottedWork(storedStreet);
          await fetchPoints(storedUserId); // Fetch initial points
        } else {
          console.log("No userId or street found in AsyncStorage - Redirecting to login");
          navigation.navigate("userlogin");
        }
      } catch (error) {
        console.error("Error loading user info:", error);
        showNotification("Error", "Failed to load user information. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    loadUserInfo();
  }, []);

  useEffect(() => {
    if (userId) {
      // Periodically fetch points every 30 seconds
      const interval = setInterval(() => {
        fetchPoints(userId);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  useEffect(() => {
    const checkCollectionStatus = () => {
      if (allottedWork && allottedWork.status === "Collected") {
        showNotification(
          "Garbage Collection Complete",
          "Your garbage has been collected successfully!",
          "OK",
          async () => {
            setIsMarked(false);
            await AsyncStorage.setItem("userTodayStatus", "NO");
            setAllottedWork(null);
          }
        );
      }
    };
    checkCollectionStatus();
  }, [allottedWork]);

  const fetchTodayStatus = async (userId) => {
    try {
      console.log("Fetching todayStatus for userId:", userId);
      const response = await axios.get(`${api}/api/user/${userId}`);
      const { todayStatus } = response.data;
      console.log("Fetched todayStatus:", todayStatus);
      const normalizedStatus = todayStatus?.toUpperCase();
      setIsMarked(normalizedStatus === "YES");
      setTodayStatus(normalizedStatus);
      await AsyncStorage.setItem("todayStatus", normalizedStatus || "NO");
    } catch (error) {
      console.error("Error fetching todayStatus:", error.response?.data || error);
      setIsMarked(false);
      setTodayStatus("NO");
      await AsyncStorage.setItem("todayStatus", "NO");
    }
  };

  const fetchAllottedWork = async (street) => {
    try {
      setLoading(true);
      const inchargerId = await AsyncStorage.getItem("userInchargerId");
      if (!inchargerId) {
        console.log("No inchargerId found, skipping allotted work fetch");
        setAllottedWork(null);
        showNotification("Info", "No collection scheduled");
        return;
      }

      const response = await axios.get(`${api}/api/allotwork/pending/all`, {
        params: { street, inchargerId }
      });

      if (response.data && response.data.length > 0) {
        const work = response.data[0];
        if (work.status === "Collected") {
          setAllottedWork(null);
          setIsMarked(false);
          await AsyncStorage.setItem("userTodayStatus", "NO");
        } else {
          setAllottedWork(work);
          setCurrentAllotmentId(work._id);
        }
        setUserAllotments(response.data);
      } else {
        setAllottedWork(null);
        setUserAllotments([]);
        showNotification("Info", "No collection scheduled");
      }
    } catch (error) {
      if (error.response?.data?.message === "No pending allotments found") {
        setAllottedWork(null);
        setUserAllotments([]);
        showNotification("Info", "No collection scheduled");
      } else {
        console.warn("Unexpected error fetching allotted work:", error.response?.data || error.message);
        setAllottedWork(null);
        setUserAllotments([]);
        showNotification("Error", "Failed to connect to server. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateTodayStatus = async (newStatus) => {
    try {
      if (!userId) {
        showNotification("Error", "User ID not found. Please login again.");
        return;
      }

      console.log("Updating status for userId:", userId, "to:", newStatus);
      const response = await axios.patch(`${api}/api/user/today-status/${userId}`, {
        status: newStatus,
      });

      console.log("Status update response:", response.data);
      setIsMarked(newStatus === "YES");
      await AsyncStorage.setItem("todayStatus", newStatus);
      showNotification("Success", "Status updated successfully!");
    } catch (error) {
      console.error("❌ Error updating status:", error.message);
      showNotification("Error", "Failed to update status. Please try again.");
    }
  };

  const handleConfirmCollection = async (allotmentId) => {
    try {
      setAcknowledging(true);
      const response = await axios.put(
        `${api}/api/allotWork/acknowledge/${userId}`,
        {
          allotmentId: allotmentId
        }
      );

      if (response.data.success) {
        await axios.patch(`${api}/api/user/today-status/${userId}`, {
          status: "NO"
        });

        showNotification(
          "Success",
          "Collection acknowledged successfully",
          "OK",
          () => {
            setIsMarked(false);
            fetchAllottedWork(userStreet);
            fetchTodayStatus(userId);
          }
        );
      }
    } catch (error) {
      console.error("Error acknowledging collection:", error);
      showNotification(
        "Error",
        error.response?.data?.message || "Failed to acknowledge collection"
      );
    } finally {
      setAcknowledging(false);
    }
  };

  const handleMarkStatus = async (newStatus) => {
    try {
      const normalizedStatus = newStatus.toUpperCase();
      await updateTodayStatus(normalizedStatus);
      
      setIsMarked(normalizedStatus === "YES");
      setTodayStatus(normalizedStatus);
      
      await AsyncStorage.setItem("todayStatus", normalizedStatus);
      
      if (userStreet) {
        await fetchAllottedWork(userStreet);
      }
    } catch (error) {
      console.error("Error marking status:", error);
      const currentStatus = await AsyncStorage.getItem("todayStatus");
      setIsMarked(currentStatus === "YES");
      setTodayStatus(currentStatus);
      showNotification("Error", "Failed to update status. Please try again.");
    }
  };

  const renderCollectionStatus = () => {
    if (!allottedWork) return null;

    const userLocation = allottedWork.locationData?.find(
      loc => loc.userId === userId
    );

    if (!userLocation) return null;

    if (allottedWork.status === "Pending Confirmation" && userLocation.todayStatus === "YES" && !userLocation.collectionAcknowledged) {
      return (
        <View style={styles.statusContainer}>
          <Text style={styles.statusHeaderText}>Collection Notification</Text>
          <Text style={styles.statusText}>
            Garbage collection completed by {allottedWork.labourName}. Please confirm to complete the process.
          </Text>
          <TouchableOpacity 
            style={styles.confirmButton}
            onPress={() => handleConfirmCollection(allottedWork._id)}
            disabled={acknowledging}
          >
            <Text style={styles.confirmButtonText}>
              {acknowledging ? "Processing..." : "Confirm Collection"}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  const toggleMenu = () => {
    Animated.timing(slideAnim, {
      toValue: menuVisible ? -250 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setMenuVisible(!menuVisible);
  };

  const confirmToggleMark = () => {
    showNotification(
      "Confirm Action",
      `Are you sure you want to ${isMarked ? "turn OFF" : "turn ON"} garbage collection for today?`,
      "Confirm",
      async () => {
        const newStatus = isMarked ? "NO" : "YES";
        await handleMarkStatus(newStatus);
      }
    );
  };

  const renderAllotments = () => {
    if (userAllotments.length === 0) {
      return (
        <View style={styles.statusContainer}>
          <Text style={styles.noScheduleText}>No collection history available</Text>
        </View>
      );
    }

    return userAllotments.map((allotment) => (
      <View key={allotment._id} style={styles.allotmentCard}>
        <View style={styles.allotmentHeader}>
          <Ionicons name="location" size={18} color="#555" />
          <Text style={styles.locationText}>{allotment.location}</Text>
        </View>
        
        <View style={[
          styles.statusBadge,
          allotment.status === "Collected" ? styles.collectedStatus : styles.pendingStatus
        ]}>
          <Text style={styles.statusBadgeText}>
            {allotment.status}
          </Text>
        </View>
        
        {allotment.status === "Pending Confirmation" && (
          <TouchableOpacity 
            style={styles.confirmButton}
            onPress={() => handleConfirmCollection(allotment._id)}
            disabled={acknowledging}
          >
            <Text style={styles.confirmButtonText}>
              {acknowledging ? "Processing..." : "Confirm Collection"}
            </Text>
          </TouchableOpacity>
        )}
        
        {allotment.status === "Collected" && (
          <Text style={styles.confirmedText}>✓ Collection Confirmed</Text>
        )}
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      {menuVisible && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={toggleMenu}
        />
      )}

      <View style={styles.header}>
        <TouchableOpacity onPress={toggleMenu} style={styles.menuIcon}>
          <Ionicons name="menu" size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.logo}>User Dashboard</Text>

        <TouchableOpacity
          onPress={() => navigation.navigate("userprofile")}
          style={styles.profileIcon}
        >
          <Ionicons name="person-circle" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[styles.menu, { left: slideAnim }]}
        pointerEvents={menuVisible ? "auto" : "none"}
      >
        <TouchableOpacity onPress={() => navigation.navigate("userhomepage")}>
          <Text style={styles.menuItem}>VIEW MAP</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("complaint")}>
          <Text style={styles.menuItem}>
            REPORT GARBAGE ISSUE
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("userlogin")}>
          <Text style={styles.menuItem}>LOG OUT</Text>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView contentContainerStyle={[styles.content, styles.contentContainer]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#36B37E" />
            <Text style={{marginTop: 10, color: "#555"}}>Loading your information...</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={[
                styles.circleButton,
                { backgroundColor: isMarked ? "#36B37E" : "#F05545" },
              ]}
              onPress={confirmToggleMark}
            >
              <Text style={styles.circleText}>{isMarked ? "ON" : "OFF"}</Text>
              <Text style={styles.circleSubtext}>Collection Status</Text>
            </TouchableOpacity>

            <View style={styles.scheduleCard}>
              <Text style={styles.cardTitle}>Collection Schedule</Text>
              {allottedWork ? (
                <>
                  <View style={styles.scheduleInfo}>
                    <View style={styles.scheduleRow}>
                      <Ionicons name="calendar" size={22} color="#36B37E" />
                      <Text style={styles.scheduleText}>Date: {new Date(allottedWork.date).toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.scheduleRow}>
                      <Ionicons name="time" size={22} color="#36B37E" />
                      <Text style={styles.scheduleText}>Time: {allottedWork.time}</Text>
                    </View>
                    <View style={styles.scheduleRow}>
                      <Ionicons name="person" size={22} color="#36B37E" />
                      <Text style={styles.scheduleText}>Collector: {allottedWork.labourName}</Text>
                    </View>
                    <View style={styles.scheduleRow}>
                      <Ionicons name="call" size={22} color="#36B37E" />
                      <Text style={styles.scheduleText}>Contact: {allottedWork.labourPhoneNumber}</Text>
                    </View>
                    <View style={styles.scheduleRow}>
                      <Ionicons name="checkmark-circle" size={22} color={
                        allottedWork.status === "Collected" ? "#36B37E" : "#FFA000"
                      } />
                      <Text style={styles.scheduleText}>Status: {allottedWork.status}</Text>
                    </View>
                  </View>
                </>
              ) : (
                <Text style={styles.noScheduleText}>No collection scheduled for today</Text>
              )}
            </View>

            {renderCollectionStatus()}

            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="information-circle" size={28} color="#36B37E" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Today's Status</Text>
                <Text style={styles.infoSubtitle}>
                  Collection status is currently {isMarked ? "ON" : "OFF"}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.viewProductButton}
              onPress={() => navigation.navigate("buyproduct")}
            >
              <Text style={styles.viewProductButtonText}>View Product</Text>
            </TouchableOpacity>

            {userAllotments.length > 0 && (
              <View style={styles.scheduleCard}>
                <Text style={styles.cardTitle}>Collection History</Text>
                {renderAllotments()}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <NotificationModal
        visible={notification.visible}
        title={notification.title}
        message={notification.message}
        buttonText={notification.buttonText}
        onClose={notification.onClose}
      />

      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={() => navigation.navigate("mapscreen")}
          style={styles.bottomOption}
        >
          <Ionicons name="map" size={24} color="#555" />
          <Text style={styles.bottomOptionText}>Map</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("complaint")}
          style={styles.bottomOption}
        >
          <Ionicons name="alert-circle" size={24} color="#555" />
          <Text style={styles.bottomOptionText}>Complaint</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomOption, {opacity: 1}]}
          onPress={() => navigation.navigate("userhomepage")}
        >
          <Ionicons name="home" size={24} color="#36B37E" />
          <Text style={[styles.bottomOptionText, {color: "#36B37E", fontWeight: "600"}]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("userprofile")}
          style={styles.bottomOption}
        >
          <Ionicons name="person" size={24} color="#555" />
          <Text style={styles.bottomOptionText}>Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("points")}
          style={styles.bottomOption}
        >
          <Ionicons name="star" size={24} color="#555" />
          <Text style={styles.bottomOptionText}>Points</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default UserHomePage;