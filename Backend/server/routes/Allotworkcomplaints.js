const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const AllotComplaints = require("../models/AllotComplaints");
const Complaints = require("../models/ComplaintsSchema");

// Controller to Handle Work Allocation
const allotWorkcomplaints = async (req, res) => {
  try {
    const {
      inchargerId,
      inchargerName,
      labourId,
      labourName,
      labourPhoneNumber,
      street,
      date,
      time,
      status,
      locationData,
      complaintId,
    } = req.body;

    // Log incoming payload for debugging
    console.log("Received payload:", req.body);

    // Validate required fields
    if (
      !inchargerId ||
      !inchargerName ||
      !labourId ||
      !labourName ||
      !labourPhoneNumber ||
      !street ||
      !date ||
      !time ||
      !status ||
      !locationData ||
      !complaintId
    ) {
      return res.status(400).json({
        message: "All required fields must be provided, including complaintId",
      });
    }

    // Validate locationData as a non-empty array
    if (!Array.isArray(locationData) || locationData.length === 0) {
      return res.status(400).json({
        message: "locationData must be a non-empty array",
      });
    }

    // Fetch complaint data
    const complaint = await Complaints.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Extract userId from complaint's user field
    const userIdFromComplaint = complaint.user || locationData[0].userId || "defaultUserId";

    // Extract latitude and longitude from complaint's location.coordinates
    let latitude = locationData[0].latitude || 0;
    let longitude = locationData[0].longitude || 0;
    if (complaint.location?.coordinates && Array.isArray(complaint.location.coordinates) && complaint.location.coordinates.length === 2) {
      [longitude, latitude] = complaint.location.coordinates; // [longitude, latitude] order as per GeoJSON
      console.log("Extracted Coordinates - Latitude:", latitude, "Longitude:", longitude);
    } else {
      console.warn("Invalid or missing location coordinates in complaint:", complaint.location);
    }

    // Update locationData with complaint details
    const updatedLocationData = locationData.map((location) => ({
      ...location,
      userId: userIdFromComplaint,
      userAddress: location.userAddress || complaint.address || "Unknown Address",
      date: location.date || date,
      username: location.username || complaint.userName || "Unknown User",
      latitude,
      longitude,
    }));

    // Validate each locationData entry
    for (const location of updatedLocationData) {
      if (
        !location.userId ||
        !location.userAddress ||
        !location.date ||
        !location.username
      ) {
        return res.status(400).json({
          message: "All required fields in locationData are required (userId, userAddress, date, username)",
        });
      }
      if (location.latitude && (location.latitude < -90 || location.latitude > 90)) {
        return res.status(400).json({ message: "Latitude must be between -90 and 90" });
      }
      if (location.longitude && (location.longitude < -180 || location.longitude > 180)) {
        return res.status(400).json({ message: "Longitude must be between -180 and 180" });
      }
    }

    // Create new work allocation
    console.log("Creating new work allocation...");
    const workAllocation = new AllotComplaints({
      inchargerId,
      inchargerName,
      labourId,
      labourName,
      labourPhoneNumber,
      street,
      date,
      time,
      status,
      locationData: updatedLocationData,
    });

    // Save to database
    console.log("Saving to database...");
    await workAllocation.save();
    console.log("Successfully saved to database");

    // Respond with success
    console.log("Successfully allocated work");
    res.status(201).json({
      message: "Work allocation saved successfully",
      data: workAllocation,
    });
  } catch (error) {
    console.error("Error allocating work:", error);
    res.status(400).json({
      message: error.message || "Failed to allocate work",
    });
  }
};

// Define Route
router.post("/workallocation", allotWorkcomplaints);

router.get("/labour/:labourId", async (req, res) => {
  try {
    const labourId = req.params.labourId;

    // Fetch complaints where the labourId matches
    const complaints = await AllotComplaints.find({ labourId: labourId })
      .lean();

    if (!complaints || complaints.length === 0) {
      console.log(`⚠ No allocated complaints found for labourId: ${labourId}`);
      return res.status(404).json({ message: "No allocated complaints found for this labour." });
    }

    console.log(`✅ Retrieved ${complaints.length} allocated complaints for labourId: ${labourId}`);
    res.status(200).json(complaints);
  } catch (error) {
    console.error("❌ Error fetching allocated complaints:", error.message, error.stack);
    res.status(500).json({ message: "Server error. Please try again.", error: error.message });
  }
});

router.patch('/labour/:labourId', async (req, res) => {
  try {
    const labourId = req.params.labourId;
    const { locationData } = req.body;
    const updatedComplaints = await AllotComplaints.updateMany(
      { labourId }, // Match documents where labourId matches
      { $set: { "locationData.0.status": locationData[0].status } },
      { new: true, runValidators: true }
    );
    if (updatedComplaints.modifiedCount === 0) {
      return res.status(404).json({ message: "No complaints found for this labourId" });
    }
    res.json({ message: "All complaints marked as Collected", modifiedCount: updatedComplaints.modifiedCount });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/update/labour/:labourId', async (req, res) => {
  try {
    const { allotmentId, userId, collected, markAll } = req.body;
    const { labourId } = req.params;

    const allotment = await AllotComplaints.findById(allotmentId);
    if (!allotment) {
      return res.status(404).json({ 
        success: false,
        message: 'Allotment not found' 
      });
    }

    if (markAll) {
      // Update all locations that have todayStatus as "YES"
      allotment.locationData = allotment.locationData.map(loc => {
        if (loc.todayStatus === "YES") {
          return {
            ...loc.toObject(),
            labourCollected: true,
            status: "Pending"
          };
        }
        return loc;
      });
    } else if (userId) {
      // Find and update specific location
      const locationIndex = allotment.locationData.findIndex(
        loc => loc.userId === userId
      );

      if (locationIndex === -1) {
        return res.status(404).json({ 
          success: false,
          message: 'User location not found in allotment' 
        });
      }

      if (collected && allotment.locationData[locationIndex].todayStatus === "YES") {
        allotment.locationData[locationIndex].labourCollected = true;
        allotment.locationData[locationIndex].status = "Pending";
      }
    }

    // Check if all required locations are collected
    const hasYesLocations = allotment.locationData.some(loc => loc.todayStatus === "YES");
    const allRequiredCollected = allotment.locationData.every(loc => 
      loc.labourCollected || loc.todayStatus === "NO"
    );

    if (!hasYesLocations || allRequiredCollected) {
      allotment.status = "PendingAcknowledgment";
    }

    await allotment.save();
    
    res.json({ 
      success: true, 
      message: markAll ? 'All collections marked successfully' : 'Collection status updated successfully',
      status: allotment.status
    });

  } catch (error) {
    console.error('Error updating collection status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update collection status',
      error: error.message 
    });
  }
});

module.exports = router;