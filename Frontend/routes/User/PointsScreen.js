import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  StyleSheet,
  ScrollView,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message"; // Requires: npm install react-native-toast-message
import api from "../../api";

// Styles (same as previous for consistency)
const premiumStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    paddingTop:10,
  },
  gradientBackground: {
    flex: 1,
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  header: {
    backgroundColor: "#6BBE44",
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  logo: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 24,
    letterSpacing: 1,
  },
  pointsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginVertical: 16,
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  pointsText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#264653",
    marginLeft: 12,
  },
  pointsSubText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginHorizontal: 16,
    marginBottom: 16,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  rewardsSection: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  rewardsTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#264653",
    marginBottom: 12,
    marginLeft: 16,
  },
  rewardCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  redeemButton: {
    backgroundColor: "#6BBE44",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  redeemButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  redeemButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#264653",
    marginBottom: 12,
  },
  modalButton: {
    backgroundColor: "#6BBE44",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

// Static rewards data
const REWARDS = [
  {
    rewardId: "reward1",
    name: "$5 Coffee Voucher",
    description: "Enjoy a coffee on us at any partner café.",
    pointsRequired: 50,
  },
  {
    rewardId: "reward2",
    name: "10% Grocery Discount",
    description: "Get 10% off your next grocery purchase.",
    pointsRequired: 50,
  },
  {
    rewardId: "reward3",
    name: "$10 Gift Card",
    description: "Redeem a $10 gift card for online shopping.",
    pointsRequired: 50,
  },
];

const PointsScreen = ({ navigation }) => {
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [redeemLoading, setRedeemLoading] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnims = REWARDS.map(() => useRef(new Animated.Value(0)).current);

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (!userId) {
          setError("User ID not found. Please log in again.");
          navigation.navigate("userlogin");
          return;
        }

        // Check cached points
        const cachedPoints = await AsyncStorage.getItem(`points_${userId}`);
        if (cachedPoints) setPoints(parseInt(cachedPoints));

        const response = await axios.get(`${api}/api/user-points/${userId}`, {
          timeout: 5000,
          headers: { "Content-Type": "application/json" },
        });
        setPoints(response.data.points);
        await AsyncStorage.setItem(`points_${userId}`, response.data.points.toString());

        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      } catch (err) {
        console.error("Error fetching points:", err);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to load points. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPoints();
    const interval = setInterval(fetchPoints, 60000); // Poll every 60 seconds
    return () => clearInterval(interval);
  }, [navigation, pulseAnim]);

  useEffect(() => {
    fadeAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnims]);

  const handleRedeem = async (reward) => {
    try {
      setRedeemLoading(reward.rewardId);
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "User ID not found. Please log in again.",
        });
        navigation.navigate("userlogin");
        return;
      }

      const response = await axios.post(
        `${api}/api/user-points/redeem-reward`,
        {
          userId,
          rewardId: reward.rewardId,
          pointsRequired: reward.pointsRequired,
        },
        { timeout: 5000, headers: { "Content-Type": "application/json" } }
      );

      if (response.data.success) {
        const pointsResponse = await axios.get(`${api}/api/user-points/${userId}`);
        setPoints(pointsResponse.data.points);
        await AsyncStorage.setItem(`points_${userId}`, pointsResponse.data.points.toString());
        Toast.show({
          type: "success",
          text1: "Success",
          text2: `Redeemed ${reward.name}!`,
        });
      }
    } catch (err) {
      console.error("Error redeeming reward:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.response?.data?.message || "Failed to redeem reward.",
      });
    } finally {
      setRedeemLoading(null);
      setModalVisible(false);
    }
  };

  if (loading) {
    return (
      <View style={premiumStyles.container}>
        <ActivityIndicator size="large" color="#6BBE44" />
        <Text style={{ marginTop: 10, color: "#6B7280" }}>Loading points...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={premiumStyles.container}>
        <Text style={{ color: "#EF4444", textAlign: "center", margin: 20 }}>{error}</Text>
        <TouchableOpacity
          style={{
            backgroundColor: "#6BBE44",
            borderRadius: 12,
            paddingVertical: 14,
            paddingHorizontal: 24,
            alignItems: "center",
            marginHorizontal: 16,
          }}
          onPress={() => {
            setError(null);
            setLoading(true);
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={premiumStyles.container}>
      <LinearGradient
        colors={["#A3E4D7", "#F1F5F9"]}
        style={premiumStyles.gradientBackground}
      />
      <View style={premiumStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={premiumStyles.logo}>Eco Points</Text>
        <View />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <Animated.View
          style={[premiumStyles.pointsContainer, { transform: [{ scale: pulseAnim }] }]}
        >
          <Ionicons name="star" size={32} color="#F4A261" />
          <Text style={premiumStyles.pointsText}>{points} Points</Text>
        </Animated.View>
        <Text style={premiumStyles.pointsSubText}>
          Points are earned automatically when laborers mark your recycling submissions as complete.
        </Text>

        <View style={premiumStyles.infoCard}>
          <Ionicons name="information-circle" size={28} color="#6BBE44" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#264653" }}>
              How It Works
            </Text>
            <Text style={{ fontSize: 14, color: "#6B7280", marginTop: 4 }}>
              Laborers verify your recycled materials, earning you 50 points per submission. Redeem points for exciting rewards!
            </Text>
          </View>
        </View>

        <View style={premiumStyles.rewardsSection}>
          <Text style={premiumStyles.rewardsTitle}>Rewards</Text>
          {REWARDS.map((reward, index) => (
            <Animated.View
              key={reward.rewardId}
              style={[premiumStyles.rewardCard, { opacity: fadeAnims[index] }]}
            >
              <Ionicons name="gift" size={28} color="#6BBE44" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#264653" }}>
                  {reward.name}
                </Text>
                <Text style={{ fontSize: 14, color: "#6B7280", marginTop: 4 }}>
                  {reward.description}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#6BBE44", marginTop: 4 }}>
                  {reward.pointsRequired} Points
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  premiumStyles.redeemButton,
                  points < reward.pointsRequired && premiumStyles.redeemButtonDisabled,
                ]}
                onPress={() => {
                  setSelectedReward(reward);
                  setModalVisible(true);
                }}
                disabled={points < reward.pointsRequired || redeemLoading === reward.rewardId}
              >
                {redeemLoading === reward.rewardId ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={premiumStyles.redeemButtonText}>Get</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={premiumStyles.modalContainer}>
          <View style={premiumStyles.modalContent}>
            <Text style={premiumStyles.modalTitle}>
              Redeem {selectedReward?.name}?
            </Text>
            <Text style={{ fontSize: 14, color: "#6B7280", textAlign: "center" }}>
              This will deduct {selectedReward?.pointsRequired} points from your balance.
            </Text>
            <TouchableOpacity
              style={premiumStyles.modalButton}
              onPress={() => handleRedeem(selectedReward)}
            >
              <Text style={premiumStyles.modalButtonText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[premiumStyles.modalButton, { backgroundColor: "#EF4444", marginTop: 8 }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={premiumStyles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Toast />
    </View>
  );
};

export default PointsScreen;