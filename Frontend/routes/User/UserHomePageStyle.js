import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f9fc",
  },
  content: {
    flex: 1, // Safe for ScrollView style prop
    padding: 10,
    backgroundColor: "transparent",
    marginTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  contentContainer: {
    alignItems: "center", // Moved from second content definition
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    margin: 20,
  },
  menuIcon: {
    padding: 8,
  },
  profileIcon: {
    padding: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#6BBE44",
    paddingTop: 30,
    paddingBottom: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  logo: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
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
  menu: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: -250,
    width: 250,
    backgroundColor: "#2A3547",
    paddingTop: 60,
    paddingLeft: 20,
    zIndex: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  menuItem: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 24,
    color: "#fff",
  },
  pointsBox: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  pointsText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  circleButton: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 25,
    borderWidth: 4,
    borderColor: "#fff",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  circleText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  circleSubtext: {
    fontSize: 14,
    color: "#fff",
    marginTop: 4,
  },
  statusContainer: {
    width: "90%",
    padding: 20,
    marginTop: 15,
    marginBottom: 15,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusHeaderText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  statusText: {
    fontSize: 16,
    color: "#555",
    marginBottom: 16,
    lineHeight: 22,
  },
  confirmButton: {
    backgroundColor: "#36B37E",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  scheduleCard: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 22,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  scheduleInfo: {
    marginBottom: 10,
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    paddingHorizontal: 5,
  },
  scheduleText: {
    fontSize: 16,
    color: "#444",
    marginLeft: 12,
    flex: 1,
    lineHeight: 22,
  },
  noScheduleText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    fontStyle: "italic",
    paddingVertical: 15,
  },
  allotmentCard: {
    width: "100%",
    padding: 18,
    marginVertical: 12,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  allotmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  locationText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  pendingStatus: {
    backgroundColor: "#FFA000",
  },
  collectedStatus: {
    backgroundColor: "#36B37E",
  },
  confirmedText: {
    fontSize: 16,
    color: "#36B37E",
    marginTop: 12,
    fontWeight: "500",
  },
  infoCard: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 12,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  infoIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f0f8ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  infoSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  viewProductButton: {
    width: "90%",
    backgroundColor: "#6BBE44",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  viewProductButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#eaeaea",
    position: "absolute",
    bottom: 0,
    width: "100%",
    elevation: 12,
  },
  bottomOption: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  bottomOptionText: {
    fontSize: 12,
    color: "#555",
    marginTop: 4,
  },
  disabledButton: {
    backgroundColor: "#A5D6A7",
    opacity: 0.7,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  statusButton: {
    width: "90%",
    backgroundColor: "#f0fff0",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#36B37E",
    elevation: 3,
  },
  statusSubText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
    backgroundColor: "#e0ffe0",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#36B37E",
    overflow: "hidden",
  },
  scheduleButton: {
    width: "90%",
    backgroundColor: "#fff0f5",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d63384",
    elevation: 3,
  },
  scheduleSubText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
    backgroundColor: "#ffe6f0",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d63384",
    overflow: "hidden",
  },
  redDotText: {
    color: "red",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default styles;