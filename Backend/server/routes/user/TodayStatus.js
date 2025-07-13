const express = require("express");
const router = express.Router();
const User = require("../../models/UserSchema");
const AllotWork = require("../../models/allotworklabour");

// PATCH: update todayStatus using userId
router.patch("/api/user/today-status/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const { status, labourId, street } = req.body;

    console.log("Received update request for userId:", userId, "with status:", status);

    const validStatuses = ["YES", "NO", "Pending", "Collected"];
    const normalizedStatus = status.toUpperCase();
    
    if (!validStatuses.includes(normalizedStatus)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const user = await User.findOneAndUpdate(
      { userId },
      { todayStatus: normalizedStatus },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found with the provided userId" });
    }

    // Only update allotment if we have labourId and street
    if (labourId && street) {
      const allotment = await AllotWork.findOne({
        labourId,
        street,
        "locationData.userId": userId
      });

      if (allotment) {
        // Update the specific user's status in locationData
        const locationIndex = allotment.locationData.findIndex(loc => loc.userId === userId);
        if (locationIndex !== -1) {
          allotment.locationData[locationIndex].todayStatus = normalizedStatus;
        }

        // Only mark as collected if explicitly setting to Collected status
        if (normalizedStatus === "COLLECTED") {
          const allCollected = allotment.locationData.every(
            loc => loc.todayStatus === "COLLECTED" || loc.todayStatus === "NO"
          );
          if (allCollected) {
            allotment.status = "Collected";
          }
        }

        await allotment.save();
      }
    }

    res.json({ message: "Status updated", todayStatus: user.todayStatus });
  } catch (err) {
    console.error("❌ Error updating status:", err.message);
    res.status(500).json({ message: "Error updating status", error: err.message });
  }
});

// Handle user's garbage collection confirmation
router.put("/confirm-collection/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { allotmentId } = req.body;

    // Find and update the allotment
    const allotment = await AllotWork.findById(allotmentId);
    if (!allotment) {
      return res.status(404).json({ message: "Allotment not found" });
    }

    // Update the specific user's collection status
    const userIndex = allotment.locationData.findIndex(loc => loc.userId === userId);
    if (userIndex !== -1) {
      allotment.locationData[userIndex].todayStatus = "Collected";
      allotment.locationData[userIndex].collectionConfirmed = true;
    }

    // Check if all users in this batch have confirmed collection
    const allConfirmed = allotment.locationData.every(loc => 
      loc.todayStatus === "Collected" && loc.collectionConfirmed
    );

    if (allConfirmed) {
      allotment.status = "Collected";
    }

    await allotment.save();

    // Update user's today status
    await User.findByIdAndUpdate(userId, { todayStatus: "NO" });

    res.json({ message: "Collection confirmed successfully", status: allotment.status });
  } catch (err) {
    console.error("❌ Error confirming collection:", err.message);
    res.status(500).json({ message: "Error confirming collection", error: err.message });
  }
});

// Handle user's acknowledgment of garbage collection
router.post("/acknowledge-collection/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { allotmentId } = req.body;

    const allotment = await AllotWork.findById(allotmentId);
    if (!allotment) {
      return res.status(404).json({ message: "Allotment not found" });
    }

    // Update the specific user's acknowledgment status
    const userIndex = allotment.locationData.findIndex(loc => loc.userId === userId);
    if (userIndex !== -1) {
      allotment.locationData[userIndex].collectionAcknowledged = true;
      allotment.locationData[userIndex].acknowledgedAt = new Date();
      // Set the status to Pending until incharger verifies
      allotment.locationData[userIndex].todayStatus = "Pending";
    }

    // Check if all users have acknowledged
    const allAcknowledged = allotment.locationData.every(
      loc => loc.todayStatus === "YES" ? loc.collectionAcknowledged : true
    );

    if (allAcknowledged) {
      // Update main status to indicate waiting for incharger verification
      allotment.status = "Pending Incharger Verification";
    }

    await allotment.save();

    res.json({ 
      message: "Collection acknowledged successfully",
      acknowledged: true,
      status: allotment.status
    });
  } catch (err) {
    console.error("❌ Error acknowledging collection:", err.message);
    res.status(500).json({ 
      message: "Error acknowledging collection", 
      error: err.message 
    });
  }
});

router.get("/api/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user", error: err.message });
  }
});

module.exports = router;