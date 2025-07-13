const express = require("express");
const router = express.Router();
const Labour = require("../models/addlabour");
const AllotWork = require("../models/allotworklabour");
const InchargerDetails = require("../models/inchargerdetails");
const User = require("../models/UserSchema");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

router.post("/allotWork/:inchargerId", async (req, res) => {
  try {
    const { inchargerId } = req.params;
    const { street, labourid, date, time, status, locationData } = req.body;

    // Log the incoming request
    console.log("Allot work request received:", {
      inchargerId,
      street,
      labourid,
      date,
      time,
      status,
      locationDataLength: locationData?.length,
    });

    // Detailed validation with specific error messages
    const validationErrors = [];
    if (!inchargerId) validationErrors.push("Incharger ID is required");
    if (!street) validationErrors.push("Street is required");
    if (!labourid) validationErrors.push("Labour ID is required");
    if (!date) validationErrors.push("Date is required");
    if (!time) validationErrors.push("Time is required");
    if (!status) validationErrors.push("Status is required");

    if (validationErrors.length > 0) {
      console.log("Validation errors:", validationErrors);
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    // Find incharger with detailed error handling
    const incharger = await InchargerDetails.findOne({
      $or: [{ inchargerId }, { _id: inchargerId }],
    });
    if (!incharger) {
      console.log("Incharger not found for ID:", inchargerId);
      return res.status(404).json({ message: "Incharger not found" });
    }

    // Find labour with both ObjectId and labourid field
    const labour = await Labour.findOne({
      $or: [{ _id: labourid }, { labourid }],
    });

    if (!labour) {
      console.log("Labour not found for ID:", labourid);
      return res.status(404).json({ message: "Labour not found" });
    }

    // Check for existing work with detailed error handling
    const existingWork = await AllotWork.findOne({
      labourId: labourid,
      date,
      time,
      status: { $ne: "Collected" },
    });
    if (existingWork) {
      console.log("Existing work found:", {
        labourId: existingWork.labourId,
        date: existingWork.date,
        time: existingWork.time,
      });
      return res.status(400).json({
        message: "Labour already allotted for this date and time",
        existingWork: {
          street: existingWork.street,
          date: existingWork.date,
          time: existingWork.time,
        },
      });
    }

    // Validate status enum
    const validStatuses = [
      "Yes",
      "No",
      "Pending",
      "Collected",
      "PendingAcknowledgment",
      "Off",
    ];
    const normalizedStatus =
      status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    if (!validStatuses.includes(normalizedStatus)) {
      console.log("Invalid status value:", status);
      return res.status(400).json({
        message: "Invalid status value",
        validValues: validStatuses,
      });
    }

    // Format location data
    const formattedLocationData = locationData?.map((user) => ({
      userId: user.userId || "N/A",
      userAddress: user.userAddress || "Address not available",
      latitude: parseFloat(user.latitude) || 0.0,
      longitude: parseFloat(user.longitude) || 0.0,
      username: user.username || "Unknown",
      contact: user.contact || "N/A",
      todayStatus: user.todayStatus || "NO",
    })) || [];

    // Create new work assignment
    const newWork = new AllotWork({
      inchargerId,
      inchargerName: incharger.name,
      labourId: labourid,
      labourName: labour.name,
      labourPhoneNumber: labour.phoneNumber,
      street,
      date,
      time,
      status: normalizedStatus,
      locationData: formattedLocationData,
    });

    // Save with detailed error handling
    try {
      const savedWork = await newWork.save();
      console.log("Successfully saved allotment:", savedWork._id);
      res.status(201).json({
        message: "Work allotted successfully",
        data: savedWork,
      });
    } catch (saveError) {
      console.error("Error saving allotment:", saveError);
      if (saveError.name === "ValidationError") {
        return res.status(400).json({
          message: "Validation error",
          errors: Object.values(saveError.errors).map((err) => err.message),
        });
      }
      throw saveError;
    }
  } catch (error) {
    console.error("Error allotting work:", error);
    res.status(500).json({
      message: "Server error while allotting work",
      error: error.message,
    });
  }
});

router.get("/pending/all", async (req, res) => {
  try {
    const { street, inchargerId } = req.query;
    if (!street || !inchargerId) {
      return res.status(400).json({
        message: "street and inchargerId are required",
      });
    }
    const allotments = await AllotWork.find({
      street,
      inchargerId,
      status: { $ne: "Collected" },
    }).select(
      "street date time status locationData labourId labourName labourPhoneNumber"
    );

    const formattedAllotments = allotments.map((allotment) => ({
      _id: allotment._id,
      street: allotment.street,
      date: new Date(allotment.date).toISOString(),
      time: allotment.time,
      status: allotment.status,
      labourId: allotment.labourId,
      labourName: allotment.labourName,
      labourPhoneNumber: allotment.labourPhoneNumber,
      locationData: Array.isArray(allotment.locationData)
        ? allotment.locationData
        : [allotment.locationData || {}],
      allUserDetails: Array.isArray(allotment.locationData)
        ? allotment.locationData.map((loc) => ({
            userId: loc.userId || "N/A",
            userAddress: loc.userAddress || "Address not available",
            username: loc.username || "Unknown",
            contact: loc.contact || "N/A",
          }))
        : [],
    }));

    // Return 200 with empty array if no allotments found
    console.log(
      `Found ${formattedAllotments.length} pending allotments for inchargerId: ${inchargerId}, street: ${street}`
    );
    res.status(200).json(formattedAllotments);
  } catch (error) {
    console.error("Error fetching allotments:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/allotments/:inchargerId", async (req, res) => {
  try {
    const { inchargerId } = req.params;
    if (!inchargerId) {
      return res.status(400).json({ message: "inchargerId is required" });
    }

    const allotments = await AllotWork.find({ inchargerId }).select(
      "inchargerId inchargerName labourId labourName labourPhoneNumber date time status locationData allUserDetails street"
    );

    const formattedAllotments = allotments.map((allotment) => ({
      _id: allotment._id,
      inchargerId: allotment.inchargerId,
      inchargerName: allotment.inchargerName,
      labourId: allotment.labourId,
      labourName: allotment.labourName,
      labourPhoneNumber: allotment.labourPhoneNumber,
      date: new Date(allotment.date).toISOString(),
      time: allotment.time,
      status: allotment.status,
      street: allotment.street,
      locationData: Array.isArray(allotment.locationData)
        ? allotment.locationData.map((loc) => ({
            userId: loc.userId || "N/A",
            userAddress: loc.userAddress || "Address not available",
            latitude: parseFloat(loc.latitude) || 0.0,
            longitude: parseFloat(loc.longitude) || 0.0,
            username: loc.username || "Unknown",
            contact: loc.contact || "N/A",
            todayStatus: loc.todayStatus || "N/A",
          }))
        : [],
    }));

    console.log(
      `Found ${formattedAllotments.length} allotments for inchargerId: ${inchargerId}`
    );
    res.status(200).json(formattedAllotments);
  } catch (error) {
    console.error("Error fetching allotments:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/pending/:labourId", async (req, res) => {
  try {
    const { labourId } = req.params;
    console.log("Fetching allotments for labourId:", labourId);

    const labour = await Labour.findOne({
      $or: [{ _id: labourId }, { labourid: labourId }],
    });

    if (!labour) {
      console.log("Labour not found with ID:", labourId);
      return res.status(404).json({ message: "Labour not found" });
    }

    console.log("Found labour:", {
      _id: labour._id,
      labourid: labour.labourid,
      name: labour.name,
    });

    const allotments = await AllotWork.find({
      $or: [
        { labourId: labour._id.toString() },
        { labourId: labour.labourid.toString() },
      ],
    }).select(
      "street date time status locationData labourId labourName labourPhoneNumber"
    );

    console.log("Found allotments:", JSON.stringify(allotments, null, 2));

    const formattedAllotments = allotments.map((allotment) => ({
      _id: allotment._id,
      street: allotment.street,
      date: allotment.date,
      time: allotment.time,
      status: allotment.status,
      labourId: allotment.labourId,
      labourName: allotment.labourName,
      labourPhoneNumber: allotment.labourPhoneNumber,
      locationData: Array.isArray(allotment.locationData)
        ? allotment.locationData.map((loc) => ({
            userId: loc.userId || "N/A",
            userAddress: loc.userAddress || "Address not available",
            latitude: parseFloat(loc.latitude) || 0.0,
            longitude: parseFloat(loc.longitude) || 0.0,
            username: loc.username || "Unknown",
            contact: loc.contact || "N/A",
            todayStatus: loc.todayStatus || "N/A",
          }))
        : [],
    }));

    res.status(200).json(formattedAllotments);
  } catch (error) {
    console.error("Error fetching allotments:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/update/labour/:labourId", async (req, res) => {
  try {
    const { allotmentId, userId, collected, markAll } = req.body;
    const { labourId } = req.params;

    const allotment = await AllotWork.findById(allotmentId);
    if (!allotment) {
      return res.status(404).json({
        success: false,
        message: "Allotment not found",
      });
    }

    if (markAll) {
      allotment.locationData = allotment.locationData.map((loc) => {
        if (loc.todayStatus === "YES") {
          return {
            ...loc.toObject(),
            labourCollected: true,
            todayStatus: "Pending",
          };
        }
        return loc;
      });
      allotment.labourCollected = true;
    } else if (userId) {
      const locationIndex = allotment.locationData.findIndex(
        (loc) => loc.userId === userId
      );

      if (locationIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "User location not found in allotment",
        });
      }

      if (
        collected &&
        allotment.locationData[locationIndex].todayStatus === "YES"
      ) {
        allotment.locationData[locationIndex].labourCollected = true;
        allotment.locationData[locationIndex].todayStatus = "Pending";
      }
    }

    const hasYesLocations = allotment.locationData.some(
      (loc) => loc.todayStatus === "YES"
    );
    const allRequiredCollected = allotment.locationData.every(
      (loc) => loc.labourCollected || loc.todayStatus === "NO"
    );

    if (!hasYesLocations || allRequiredCollected) {
      allotment.status = "Pending Confirmation";
      allotment.labourCollected = true;
    }

    await allotment.save();

    res.json({
      success: true,
      message: markAll
        ? "All collections marked successfully"
        : "Collection status updated successfully",
      status: allotment.status,
    });
  } catch (error) {
    console.error("Error updating collection status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update collection status",
      error: error.message,
    });
  }
});

router.put("/update/user/:userId", async (req, res) => {
  try {
    const { allotmentId, confirmed } = req.body;
    const { userId } = req.params;

    const allotment = await AllotWork.findById(allotmentId);
    if (!allotment) {
      return res.status(404).json({ message: "Allotment not found" });
    }

    const locationIndex = allotment.locationData.findIndex(
      (loc) => loc.userId.toString() === userId
    );

    if (locationIndex === -1) {
      return res.status(404).json({
        message: "User location not found in allotment",
      });
    }

    allotment.locationData[locationIndex].userConfirmed = confirmed;

    if (
      allotment.locationData[locationIndex].labourCollected &&
      allotment.locationData[locationIndex].userConfirmed
    ) {
      allotment.locationData[locationIndex].collectionConfirmed = true;
    }

    const allConfirmed = allotment.locationData.every(
      (loc) => loc.collectionConfirmed
    );

    if (allConfirmed) {
      allotment.status = "Collected";
    }

    await allotment.save();

    res.json({
      success: true,
      message: "Collection confirmation updated successfully",
      status: allotment.status,
    });
  } catch (error) {
    console.error("Error updating collection confirmation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update collection confirmation",
    });
  }
});

router.put("/acknowledge/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { allotmentId } = req.body;

    const allotment = await AllotWork.findById(allotmentId);
    if (!allotment) {
      return res.status(404).json({ message: "Allotment not found" });
    }

    const locationIndex = allotment.locationData.findIndex(
      (loc) => loc.userId.toString() === userId
    );

    if (locationIndex === -1) {
      return res.status(404).json({
        message: "User location not found in allotment",
      });
    }

    allotment.locationData[locationIndex].collectionAcknowledged = true;
    allotment.locationData[locationIndex].acknowledgedAt = new Date();
    allotment.locationData[locationIndex].todayStatus = "NO";

    await allotment.save();

    res.json({
      success: true,
      message: "Collection acknowledged successfully",
    });
  } catch (error) {
    console.error("Error acknowledging collection:", error);
    res.status(500).json({
      success: false,
      message: "Failed to acknowledge collection",
    });
  }
});

router.put("/confirm/:allotmentId", async (req, res) => {
  try {
    const { allotmentId } = req.params;
    const { userId } = req.body;

    const allotment = await AllotWork.findById(allotmentId);
    if (!allotment) {
      return res.status(404).json({ message: "Allotment not found" });
    }

    const locationIndex = allotment.locationData.findIndex(
      (loc) => loc.userId.toString() === userId
    );

    if (locationIndex === -1) {
      return res.status(404).json({
        message: "User location not found in allotment",
      });
    }

    allotment.locationData[locationIndex].collectionConfirmed = true;
    allotment.locationData[locationIndex].confirmedAt = new Date();

    const allConfirmed = allotment.locationData.every(
      (loc) => loc.collectionConfirmed || loc.todayStatus === "NO"
    );

    if (allConfirmed) {
      allotment.status = "Collected";
      allotment.completed = true;
      allotment.completedAt = new Date();
    }

    await allotment.save();

    res.json({
      success: true,
      message: "Collection confirmed successfully",
      status: allotment.status,
    });
  } catch (error) {
    console.error("Error confirming collection:", error);
    res.status(500).json({
      success: false,
      message: "Failed to confirm collection",
    });
  }
});
router.delete("/remove/:inchargerId/:labourId", async (req, res) => {
  try {
    const { inchargerId, labourId } = req.params;
    const { street, date } = req.query;

    // Validate required parameters
    if (!inchargerId || !labourId || !street || !date) {
      console.log("Missing parameters:", { inchargerId, labourId, street, date });
      return res.status(400).json({
        error: "Missing required parameters: inchargerId, labourId, street, date",
      });
    }

    // Normalize date to match database format
    const normalizedDate = date.endsWith("Z") ? date : `${date}T00:00:00.000Z`;

    // Log query parameters for debugging
    console.log("DELETE query parameters:", {
      inchargerId,
      labourId,
      street,
      date,
      normalizedDate,
    });

    // Check if document exists
    const existingWork = await AllotWork.findOne({
      inchargerId,
      labourId,
      street: { $regex: `^${street}$`, $options: "i" },
      date: normalizedDate,
    });

    if (!existingWork) {
      console.log("No matching allotment found:", {
        inchargerId,
        labourId,
        street,
        normalizedDate,
      });
      return res.status(200).json({ message: "No work to remove" });
    }

    // Perform deletion
    const result = await AllotWork.deleteOne({
      inchargerId,
      labourId,
      street: { $regex: `^${street}$`, $options: "i" },
      date: normalizedDate,
    });

    if (result.deletedCount === 0) {
      console.log("Deletion failed, no document deleted:", {
        inchargerId,
        labourId,
        street,
        normalizedDate,
      });
      return res.status(200).json({ message: "No work to remove" });
    }

    console.log(
      `Allotment deleted for inchargerId: ${inchargerId}, labourId: ${labourId}`
    );
    res.status(200).json({ message: "Allotted work removed successfully" });
  } catch (error) {
    console.error("Error removing allotted work:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/gemini", async (req, res) => {
  try {
    const { inchargerId, prompt } = req.body;
    if (!inchargerId || !prompt) {
      return res.status(400).json({
        message: "inchargerId and prompt are required",
      });
    }

    const incharger = await InchargerDetails.findOne({
      $or: [{ inchargerId }, { _id: inchargerId }],
    });
    if (!incharger) {
      return res.status(404).json({ message: "Incharger not found" });
    }

    const labours = await Labour.find({ inchargerId });
    const labourInfo = labours
      .map(
        (labour) =>
          `Labour: ${labour.name}, Phone: ${labour.phoneNumber}, ID: ${labour.labourid}`
      )
      .join("\n");

    const allotments = await AllotWork.find({
      inchargerId,
      status: { $ne: "Collected" },
    });
    const allotmentInfo = allotments
      .map((allotment) => {
        const date = new Date(allotment.date).toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        });
        return `Labour: ${allotment.labourName}, Street: ${allotment.street}, Date: ${date}, Time: ${allotment.time}, Status: ${allotment.status}`;
      })
      .join("\n");

    const users = await User.find({
      "assignedIncharger.inchargerId": inchargerId,
      todayStatus: { $in: ["YES", "yes"] },
    });
    const userInfo = users
      .map(
        (user) =>
          `User: ${user.name}, Street: ${user.street}, Status: ${user.todayStatus}`
      )
      .join("\n");

    const context = `
      Incharger: ${incharger.name}
      Labours:
      ${labourInfo || "No labours assigned."}
      Pending Work Allotments:
      ${allotmentInfo || "No pending allotments."}
      Active Users:
      ${userInfo || "No active users."}
    `;

    const fullPrompt = `${context}\n\nPrompt: ${prompt}\nAnswer concisely.`;
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const aiResponse = response.text();

    res.json({ response: aiResponse });
  } catch (error) {
    console.error("Error processing Gemini request:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/allotted-labours/:inchargerId", async (req, res) => {
  try {
    const { inchargerId } = req.params;
    if (!inchargerId) {
      return res.status(400).json({ message: "inchargerId is required" });
    }

    const labourCount = await AllotWork.countDocuments({
      inchargerId,
      status: { $ne: "Collected" },
    });

    console.log(
      `Allotted labours count for inchargerId: ${inchargerId} -> ${labourCount}`
    );
    res.status(200).json({ count: labourCount });
  } catch (error) {
    console.error("Error fetching allotted labours count:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/locations/yesCount/:selectedStreet", async (req, res) => {
  try {
    const { selectedStreet } = req.params;
    console.log("Received request for yes user count on street:", selectedStreet);

    const yesUserCount = await User.countDocuments({
      todayStatus: { $in: ["YES", "yes"] },
      street: selectedStreet,
    });

    res.json({ yesUserCount });
  } catch (error) {
    console.error("Error fetching yes user count by street:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/unallocated/:inchargerId", async (req, res) => {
  try {
    const inchargerId = req.params.inchargerId;
    const today = new Date().toISOString().split("T")[0];

    const allAssignedWorks = await AllotWork.find({ inchargerId }).select(
      "labourId status date"
    );
    console.log("All Assigned Works (history):", allAssignedWorks);

    const pendingLabourIds = new Set();
    allAssignedWorks.forEach((work) => {
      if (work.status?.toLowerCase() === "pending") {
        pendingLabourIds.add(work.labourId.toString());
      }
    });
    console.log("Labour IDs with pending status:", Array.from(pendingLabourIds));

    const collectedWorksToday = await AllotWork.find({
      inchargerId,
      date: today,
      status: { $regex: /^collected$/i },
    }).select("labourId status date");
    console.log("Collected Works for today:", collectedWorksToday);

    const collectedLabourIds = new Set();
    collectedWorksToday.forEach((work) => {
      collectedLabourIds.add(work.labourId.toString());
    });
    console.log(
      "Labour IDs with collected status for today:",
      Array.from(collectedLabourIds)
    );

    const collectedLabourIdsOtherDates = new Set();
    allAssignedWorks.forEach((work) => {
      if (work.status?.toLowerCase() === "collected" && work.date !== today) {
        collectedLabourIdsOtherDates.add(work.labourId.toString());
      }
    });
    console.log(
      "Labour IDs with collected status for other dates:",
      Array.from(collectedLabourIdsOtherDates)
    );

    const allLabors = await Labour.find({ inchargerId });
    console.log(
      "All Labors with labourid:",
      allLabors.map((l) => ({ _id: l._id, labourid: l.labourid }))
    );

    const filteredLabors = allLabors.filter((labor) => {
      const labourIdStr = labor.labourid.toString();
      const hasPendingHistory = pendingLabourIds.has(labourIdStr);
      const isCollectedToday = collectedLabourIds.has(labourIdStr);
      const hasCollectedOtherDates = collectedLabourIdsOtherDates.has(labourIdStr);
      return (
        !hasPendingHistory &&
        !hasCollectedOtherDates &&
        (isCollectedToday || !collectedLabourIds.has(labourIdStr))
      );
    });
    console.log("Filtered Labors for today:", filteredLabors);

    res.status(200).json(filteredLabors);
  } catch (error) {
    console.error("Error fetching labors:", error);
    res.status(500).json({
      message: "Error fetching labors",
      error: `${error.message}`,
    });
  }
});

module.exports = router;
