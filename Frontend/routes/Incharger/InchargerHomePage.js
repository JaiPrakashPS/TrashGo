import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import api from "../../api";

const { width } = Dimensions.get("window");

const InchargerHomePage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-250)).current;
  const streetName = route.params?.streetName || "Unknown Street";
  const [inchargerId, setInchargerId] = useState(null);
  const [loadingId, setLoadingId] = useState(true);
  const [labourCount, setLabourCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(false);
  const [noLaboursMessage, setNoLaboursMessage] = useState(null);
  const [complaintsCount, setComplaintsCount] = useState(5); // Default count or fetch from API

  const fetchInchargerId = async () => {
    try {
      const storedId = await AsyncStorage.getItem("inchargerId");
      if (storedId) {
        setInchargerId(storedId);
      } else {
        console.warn("No inchargerId found in AsyncStorage. Using route param or default.");
        setInchargerId(route.params?.inchargerId || "sampleInchargerId123");
      }
    } catch (error) {
      console.error("Error fetching inchargerId:", error);
      setInchargerId("sampleInchargerId123");
    } finally {
      setLoadingId(false);
    }
  };

  const fetchLabourCount = async () => {
    if (!inchargerId) return;
    setLoadingCount(true);
    setNoLaboursMessage(null); // Reset message
    try {
      const response = await axios.get(
        `${api}/api/allotWork/allotted-labours/${inchargerId}`,
        { timeout: 5000 }
      );
      console.log("Labour count response:", JSON.stringify(response.data, null, 2));
      setLabourCount(response.data.count || 0);
      if (response.data.count === 0) {
        setNoLaboursMessage("No labours allotted");
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setLabourCount(0);
        setNoLaboursMessage("No labours allotted");
      } else {
        setLabourCount(0);
        setNoLaboursMessage("Failed to fetch labour count");
      }
    } finally {
      setLoadingCount(false);
    }
  };

  // This function would fetch complaints count from API
  const fetchComplaintsCount = async () => {
    // Implement API call to get complaints count
    // For now, we'll use the default value set in state
  };

  useEffect(() => {
    fetchInchargerId();
  }, [route.params?.inchargerId]);

  useFocusEffect(
    React.useCallback(() => {
      if (inchargerId) {
        fetchLabourCount();
        fetchComplaintsCount(); // Add complaints fetch
      }
      return () => {};
    }, [inchargerId])
  );

  useEffect(() => {
    if (route.params?.labourCount !== undefined) {
      setLabourCount(route.params.labourCount);
      setNoLaboursMessage(route.params.labourCount === 0 ? "No labours allotted" : null);
    }
  }, [route.params?.labourCount]);

  const toggleMenu = () => {
    Animated.timing(slideAnim, {
      toValue: menuVisible ? -250 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setMenuVisible(!menuVisible);
  };

  const handleLabourDetails = () => {
    if (inchargerId) {
      navigation.navigate("allottedlabourdetails", { inchargerId });
    }
  };

  if (loadingId || loadingCount) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
      
      {/* Side Menu */}
      <Animated.View 
        style={[
          styles.sideMenu,
          { transform: [{ translateX: slideAnim }] }
        ]}
      >
        <View style={styles.menuHeader}>
          <Text style={styles.menuTitle}>Menu</Text>
        </View>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("InchargerProfile")}>
          <Ionicons name="person-outline" size={20} color="#4CAF50" />
          <Text style={styles.menuItemText}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("InchargerComplaints")}>
          <Ionicons name="alert-outline" size={20} color="#4CAF50" />
          <Text style={styles.menuItemText}>Complaints</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="settings-outline" size={20} color="#4CAF50" />
          <Text style={styles.menuItemText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="log-out-outline" size={20} color="#4CAF50" />
          <Text style={styles.menuItemText}>Logout</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Overlay for menu */}
      {menuVisible && (
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={toggleMenu} 
        />
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleMenu} style={styles.iconBtn}>
          <Ionicons name="menu" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <TouchableOpacity onPress={() => navigation.navigate("InchargerProfile")} style={styles.iconBtn}>
          <Ionicons name="person" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Street Name Bar */}
      <View style={styles.streetBar}>
        <Ionicons name="location-outline" size={16} color="#4CAF50" />
        <Text style={styles.streetText}>{streetName}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <TouchableOpacity 
            style={styles.statCard} 
            onPress={() => navigation.navigate("InchargerComplaints")}
          >
            <View style={styles.statHeader}>
              <Ionicons name="alert-circle-outline" size={18} color="#F44336" />
              <Text style={styles.statTitle}>Complaints</Text>
            </View>
            <Text style={styles.statValue}>{complaintsCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard}>
            <View style={styles.statHeader}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#4CAF50" />
              <Text style={styles.statTitle}>Tasks</Text>
            </View>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </TouchableOpacity>
        </View>

        {/* Complaints Card */}
        <TouchableOpacity 
          style={styles.complaintsCard} 
          onPress={() => navigation.navigate("InchargerComplaints")}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="warning-outline" size={20} color="#F44336" style={styles.cardIcon} />
            <Text style={styles.cardTitle}>Complaints Management</Text>
          </View>
          <Text style={styles.cardDescription}>
            You have {complaintsCount} pending complaints that require attention
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.viewDetailsText}>Review Complaints</Text>
            <Ionicons name="chevron-forward" size={16} color="#F44336" />
          </View>
        </TouchableOpacity>

        {/* Labour Card */}
        <TouchableOpacity 
          style={styles.labourCard} 
          onPress={handleLabourDetails}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="people-outline" size={20} color="#4CAF50" style={styles.cardIcon} />
            <Text style={styles.cardTitle}>Allotted Labours</Text>
          </View>
          <Text style={styles.cardDescription}>
            {noLaboursMessage || `${labourCount} labours currently assigned to tasks`}
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.viewDetailsText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color="#4CAF50" />
          </View>
        </TouchableOpacity>

        {/* Quick Actions Section */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate("allotwork", { inchargerId })}
          >
            <Ionicons name="clipboard-outline" size={24} color="#4CAF50" />
            <Text style={styles.actionText}>Allot Work</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate("addlabours")}
          >
            <Ionicons name="person-add-outline" size={24} color="#4CAF50" />
            <Text style={styles.actionText}>Add Labour</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate("mapscreen")}
          >
            <Ionicons name="map-outline" size={24} color="#4CAF50" />
            <Text style={styles.actionText}>View Map</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate("InchargerComplaints")}
          >
            <Ionicons name="alert-circle-outline" size={24} color="#F44336" />
            <Text style={styles.actionText}>View Complaints</Text>
          </TouchableOpacity>
        </View>

        {/* AI Assistant Button */}
        <TouchableOpacity
          style={styles.aiButton}
          onPress={() => navigation.navigate("inchargerai", { inchargerId })}
        >
          <Ionicons name="chatbubbles-outline" size={22} color="#FFFFFF" />
          <Text style={styles.aiButtonText}>AI Assistant</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="home" size={22} color="#4CAF50" />
          <Text style={[styles.navText, { color: "#4CAF50" }]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate("allotwork", { inchargerId })}
        >
          <Ionicons name="clipboard-outline" size={22} color="#757575" />
          <Text style={styles.navText}>Tasks</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate("InchargerComplaints")}
        >
          <Ionicons name="alert-outline" size={22} color="#757575" />
          <Text style={styles.navText}>Complaints</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate("InchargerProfile")}
        >
          <Ionicons name="person-outline" size={22} color="#757575" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#4CAF50",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#4CAF50",
    paddingTop: 40,
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  iconBtn: {
    padding: 8,
  },
  streetBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  streetText: {
    marginLeft: 5,
    fontSize: 14,
    color: "#424242",
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 80,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  statTitle: {
    fontSize: 14,
    color: "#555555",
    marginLeft: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#777777",
  },
  labourCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  complaintsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    borderLeftWidth: 3,
    borderLeftColor: "#F44336",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardIcon: {
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  cardDescription: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 10,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center", 
  },
  viewDetailsText: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "500",
    marginRight: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 10,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  actionCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginBottom: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  actionText: {
    fontSize: 12,
    color: "#555555",
    marginTop: 5,
    textAlign: "center",
  },
  aiButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF5722",
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 5,
    marginBottom: 15,
  },
  aiButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  navButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  navText: {
    fontSize: 12,
    color: "#757575",
    marginTop: 2,
  },
  sideMenu: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 250,
    height: "100%",
    backgroundColor: "#FFFFFF",
    zIndex: 10,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 5,
  },
  menuHeader: {
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  menuItemText: {
    fontSize: 16,
    color: "#333333",
    marginLeft: 15,
  },
});

export default InchargerHomePage;