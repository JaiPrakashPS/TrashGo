import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import api from "../../api";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const StatusBadge = ({ status }) => {
  const getStatusColor = () => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "#27ae60";
      case "in progress":
        return "#3498db";
      case "assigned":
        return "#f39c12";
      default:
        return "#e74c3c"; // Pending or unknown
    }
  };

  return (
    <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
      <Text style={styles.statusBadgeText}>{status || "Pending"}</Text>
    </View>
  );
};

const InchargerComplaints = () => {
  const navigation = useNavigation();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const fetchComplaints = async () => {
    try {
      const inchargerId = await AsyncStorage.getItem("inchargerId");
      if (!inchargerId) {
        console.warn("No inchargerId found in AsyncStorage");
        setComplaints([]);
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${api}/api/complaints/incharger/${inchargerId}`
      );
      const data = response.data;
      if (data && Array.isArray(data)) {
        // Sort complaints by date (newest first) and then by status
        const sortedComplaints = [...data].sort((a, b) => {
          // First compare by date
          const dateA = new Date(a.date || 0);
          const dateB = new Date(b.date || 0);
          if (dateB - dateA !== 0) return dateB - dateA;
          
          // If dates are the same, sort by status priority
          const statusPriority = {
            "pending": 0,
            "assigned": 1,
            "in progress": 2,
            "completed": 3,
          };
          
          const priorityA = statusPriority[a.status?.toLowerCase()] || 0;
          const priorityB = statusPriority[b.status?.toLowerCase()] || 0;
          return priorityA - priorityB;
        });
        
        setComplaints(sortedComplaints);
      } else {
        setComplaints([]);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message?.toLowerCase();
      if (errorMessage && errorMessage.includes("no complaints found")) {
        // Treat "No complaints found" as a successful response, no console log
        setComplaints([]);
      } else {
        // Log other errors for debugging
        console.error("Error fetching complaints:", error.response?.data || error.message);
        setComplaints([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", fetchComplaints);
    return unsubscribe;
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchComplaints();
  };

  const renderItem = ({ item, index }) => {
    const formattedDate = item.date
      ? new Date(item.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "No date";

    return (
      <TouchableOpacity
        style={[
          styles.listItem,
          { marginTop: index === 0 ? 10 : 0 },
        ]}
        onPress={() =>
          navigation.navigate("allotworkcomplaints", {
            complaint: item,
          })
        }
        activeOpacity={0.7}
      >
        <View style={styles.listItemHeader}>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={16} color="#4CAF50" />
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
          <StatusBadge status={item.status} />
        </View>

        <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="tail">
          {item.address || "No address provided"}
        </Text>

        <View style={styles.separator} />

        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Ionicons name="person-outline" size={16} color="#4CAF50" />
            <Text style={styles.detailText}>
              {item.assignedLabor || "No labor assigned"}
            </Text>
          </View>
          
          {item.category && (
            <View style={styles.detailItem}>
              <Ionicons name="pricetag-outline" size={16} color="#4CAF50" />
              <Text style={styles.detailText}>{item.category}</Text>
            </View>
          )}
        </View>

        <View style={styles.arrowContainer}>
          <Ionicons name="chevron-forward" size={24} color="#4CAF50" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconContainer}>
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Complaints</Text>
          <Text style={styles.subtitle}>{currentDate}</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate("InchargerProfile")}
          style={styles.iconContainer}
        >
          <Ionicons name="person-circle" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      {complaints.length > 0 && (
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {complaints.length} {complaints.length === 1 ? "complaint" : "complaints"}
          </Text>
        </View>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="alert-circle-outline" size={80} color="#4CAF50" style={styles.emptyIcon} />
      <Text style={styles.emptyTitle}>No Complaints Found</Text>
      <Text style={styles.emptyText}>
        You don't have any complaints assigned to you at the moment.
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading complaints...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
      
      <FlatList
        data={complaints}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContentContainer}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4CAF50"]}
            progressBackgroundColor="#FFFFFF"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },
  listContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  headerContainer: {
    paddingBottom: 15,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
    paddingHorizontal: 15,
    backgroundColor: "#4CAF50",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    marginTop:37,
  },
  iconContainer: {
    padding: 10,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Roboto",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 5,
    fontFamily: "Roboto",
  },
  countContainer: {
    backgroundColor: "#E8ECEF",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignSelf: "center",
    marginTop: 15,
  },
  countText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Roboto",
  },
  listItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E8ECEF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    position: "relative",
  },
  listItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
    fontFamily: "Roboto",
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    fontFamily: "Roboto",
  },
  addressText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
    fontFamily: "Roboto",
  },
  separator: {
    height: 1,
    backgroundColor: "#E8ECEF",
    marginVertical: 10,
  },
  detailsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    width: "48%",
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
    fontFamily: "Roboto",
  },
  arrowContainer: {
    position: "absolute",
    right: 20,
    top: "50%",
    transform: [{ translateY: -12 }],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 18,
    color: "#4CAF50",
    fontFamily: "Roboto",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    backgroundColor: "#F7F9FC",
  },
  emptyIcon: {
    marginBottom: 20,
  },emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
    fontFamily: "Roboto",
  },emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "Roboto",
  },
});

export default InchargerComplaints;