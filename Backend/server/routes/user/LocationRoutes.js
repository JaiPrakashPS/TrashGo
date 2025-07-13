const express = require("express");
const router = express.Router();
const User = require("../../models/UserSchema");

router.get('/yesCount/:selectedStreet', async (req, res) => {
  try {
    const { selectedStreet } = req.params;
    console.log("Received request for yes user count on street:", selectedStreet);

    const yesUserCount = await User.countDocuments({
      todayStatus: { $in: ["YES", "yes"] },
      street: selectedStreet
    });

    res.json({ yesUserCount });
  } catch (error) {
    console.error("Error fetching yes user count by street:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get('/:labourId/:selectedStreet', async (req, res) => {
  try {
    const { labourId, selectedStreet } = req.params;
    console.log("Received labourId:", labourId);
    console.log("Received selectedStreet:", selectedStreet);

    // Find users that have this labour assigned and are in the selected street
    const users = await User.find({
      'assignedLabours.labourId': labourId,
      street: selectedStreet,
      todayStatus: { $in: ["YES", "yes"] }
    });

    // Format the location data
    const locationData = users.map(user => ({
      userId: user.userId || "N/A",
      userAddress: user.address || "Address not available",
      latitude: user.location?.coordinates[1] || 0.0,
      longitude: user.location?.coordinates[0] || 0.0,
      username: user.name || "Unknown",
      contact: user.phoneNumber || "N/A",
      todayStatus: user.todayStatus || "NO"
    }));

    res.json(locationData);
  } catch (error) {
    console.error("Error fetching user locations:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;