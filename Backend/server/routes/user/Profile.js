const express = require("express");
const router = express.Router();
const User = require("../../models/UserSchema");

// 🟢 GET: Fetch User Details by userId
router.get("/details/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    console.log("Fetching user details for userId:", userId); // Debug log

    const user = await User.findOne({ userId });

    if (!user) {
      console.log("User not found with userId:", userId);
      return res.status(404).json({ message: "❌ User not found with the provided userId" });
    }

    const { name, email, phoneNumber, address, location } = user;
    const houseLocation = location ? {
      latitude: location.coordinates[1],
      longitude: location.coordinates[0],
    } : { latitude: null, longitude: null };

    res.status(200).json({
      profile: {
        name,
        email,
        phoneNumber,
        address,
        houseLocation,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching user details:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// 🟢 PUT: Update User Profile by userId

// 🟢 PUT: Update User Profile by userId
router.put("/update/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const { name, email, phoneNumber, address, office, area, street, location } = req.body;

    console.log("Updating profile for userId:", userId, "with data:", req.body);

    if (!name || !email) {
      return res.status(400).json({ message: "❌ Name and email are required" });
    }

    const user = await User.findOneAndUpdate(
      { userId },
      {
        name,
        email,
        phoneNumber,
        address,
        office,
        area,
        street,
        location: location || {
          type: "Point",
          coordinates: [0, 0],
        },
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      console.log("User not found with userId:", userId);
      return res.status(404).json({ message: "❌ User not found" });
    }

    const { _id, userId: updatedUserId, name: updatedName, email: updatedEmail, 
            phoneNumber: updatedPhone, address: updatedAddress, 
            office: updatedOffice, area: updatedArea, street: updatedStreet,
            location: updatedLocation } = user;
    
    const houseLocation = updatedLocation ? {
      latitude: updatedLocation.coordinates[1],
      longitude: updatedLocation.coordinates[0],
    } : { latitude: null, longitude: null };

    res.status(200).json({
      message: "Profile updated successfully",
      profile: {
        _id,
        userId: updatedUserId,
        name: updatedName,
        email: updatedEmail,
        phoneNumber: updatedPhone,
        address: updatedAddress,
        office: updatedOffice,
        area: updatedArea,
        street: updatedStreet,
        houseLocation,
      },
    });
  } catch (error) {
    console.error("❌ Error updating user profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;