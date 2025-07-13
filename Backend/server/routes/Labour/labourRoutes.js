// routes/labourRoutes.js
const express = require("express");
const bcrypt = require("bcrypt");
const Labour = require("../../models/addlabour");
const LabourLogin = require("../../models/LabourLoginHistory");
const AllotWork = require('../../models/allotworklabour');

const router = express.Router();
router.post("/login", async (req, res) => {
  const { phoneNumber, password } = req.body;

  try {
    const labour = await Labour.findOne({ phoneNumber });

    if (!labour) {
      return res.status(404).json({ error: "Labour not found." });
    }

    const isMatch = await bcrypt.compare(password, labour.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect password." });
    }

    // Use labour.labourid and convert to string for LabourLogin
    const labourId = labour.labourid.toString();

    // Store in LabourLogin history with hashed password
    const login = new LabourLogin({
      labourId,
      phoneNumber,
      password // Store the hashed password from Labour
    });

    await login.save();

    // Fetch labour details using labourid
    const labourDetails = await Labour.findOne({ labourid: labour.labourid }).select('-password');

    res.status(200).json({
      message: "Login successful",
      labourId,
      labourDetails,
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get labour details by ID
router.get("/labour/:id", async (req, res) => {
  try {
    const labourId = req.params.id; // labourId from AsyncStorage (e.g., "67f8ddbb4c6cfea1ab32d1d5")

    // Find labour by labourid field
    const labour = await Labour.findOne({ labourid: labourId });

    if (!labour) {
      return res.status(404).json({ error: "Labour not found." });
    }

    res.status(200).json({
      inchargerName: labour.inchargerName,
      inchargerPhone: labour.inchargerPhone
    });
  } catch (error) {
    console.error("Fetch labour error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.put('/confirm-collection/:allotmentId', async (req, res) => {
  try {
    const { allotmentId } = req.params;
    const allotment = await AllotWork.findById(allotmentId);

    if (!allotment) {
      return res.status(404).json({ message: 'Allotment not found' });
    }

    // Mark that labour has collected
    allotment.labourCollected = true;

    // Update status to pending acknowledgment
    allotment.status = 'PendingAcknowledgment';

    // Update each location's status to NO when marked as collected
    allotment.locationData.forEach(location => {
      if (location.todayStatus === 'YES') {
        location.todayStatus = 'NO';
      }
    });

    await allotment.save();

    res.status(200).json({
      message: 'Collection marked by labour, waiting for acknowledgment',
      status: allotment.status,
      labourCollected: true
    });
  } catch (error) {
    console.error('Error confirming collection:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/update/:labourId', async (req, res) => {
  try {
    const { allotmentId, userId, collected, markAll } = req.body;
    const { labourId } = req.params;

    // Input validation
    if (!allotmentId) {
      return res.status(400).json({
        success: false,
        message: 'Allotment ID is required'
      });
    }

    if (!markAll && !userId) {
      return res.status(400).json({
        success: false,
        message: 'Either userId or markAll must be provided'
      });
    }

    // Find allotment and verify it exists
    const allotment = await AllotWork.findById(allotmentId);
    if (!allotment) {
      return res.status(404).json({ 
        success: false,
        message: 'Allotment not found' 
      });
    }

    // Verify labor is assigned to this allotment
    const labour = await Labour.findOne({
      $or: [
        { _id: labourId },
        { labourid: labourId }
      ]
    });

    if (!labour) {
      return res.status(403).json({
        success: false,
        message: 'Labor not found'
      });
    }

    if (allotment.labourId.toString() !== labour._id.toString() && 
        allotment.labourId.toString() !== labour.labourid.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Labor is not authorized to update this allotment'
      });
    }

    if (markAll) {
      // Update all locations that have todayStatus as "YES"
      allotment.locationData = allotment.locationData.map(loc => ({
        ...loc.toObject(),
        labourCollected: loc.todayStatus === "YES" ? true : loc.labourCollected,
        todayStatus: loc.todayStatus === "YES" ? "NO" : loc.todayStatus,
        collectedAt: loc.todayStatus === "YES" ? new Date() : loc.collectedAt
      }));
      allotment.status = "PendingAcknowledgment";
      allotment.labourCollected = true;
    } else if (userId) {
      const locationIndex = allotment.locationData.findIndex(
        loc => loc.userId.toString() === userId.toString()
      );

      if (locationIndex === -1) {
        return res.status(404).json({ 
          success: false,
          message: 'User location not found in allotment' 
        });
      }

      if (collected && allotment.locationData[locationIndex].todayStatus === "YES") {
        allotment.locationData[locationIndex].labourCollected = true;
        allotment.locationData[locationIndex].todayStatus = "NO";
        allotment.locationData[locationIndex].collectedAt = new Date();
      } else if (collected && allotment.locationData[locationIndex].todayStatus !== "YES") {
        return res.status(400).json({
          success: false,
          message: 'Cannot mark collection for location that is not scheduled for today'
        });
      }
    }

    // Check if all required locations are collected
    const hasYesLocations = allotment.locationData.some(loc => loc.todayStatus === "YES");
    const allRequiredCollected = allotment.locationData.every(loc => 
      loc.labourCollected || loc.todayStatus === "NO"
    );

    if (!hasYesLocations || allRequiredCollected) {
      allotment.status = "PendingAcknowledgment";
      allotment.labourCollected = true;
      allotment.completedAt = new Date();
    }

    try {
      await allotment.save();
    } catch (saveError) {
      console.error('Error saving allotment:', saveError);
      return res.status(500).json({
        success: false,
        message: 'Failed to save collection status',
        error: saveError.message
      });
    }
    
    res.json({ 
      success: true, 
      message: markAll ? 'All collections marked successfully' : 'Collection status updated successfully',
      status: allotment.status,
      completedAt: allotment.completedAt
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

router.get('/detail/labour/:id', async (req, res) => {
  try {
    const labourId = req.params.id;
    console.log('Received labourId from request:', labourId);

    // Query the database with the labourid field
    const labour = await Labour.findOne({ labourid: labourId });
    console.log('Database query result for labourid:', labour);

    if (!labour) {
      console.log('No labour found for labourid:', labourId);
      return res.status(404).json({ error: `Labour not found for labourid: ${labourId}` });
    }

    const profile = {
      name: labour.name || '',
      phoneNumber: labour.phoneNumber || '',
      labourWorkingArea: Array.isArray(labour.labourWorkingArea) ? labour.labourWorkingArea : [],
      supervisingArea: labour.supervisingArea || '',
      password: labour.password || '', // Avoid in production
      labourid: labour.labourid ? labour.labourid.toString() : '',
      inchargerId: labour.inchargerId || '',
      inchargerPhone: labour.inchargerPhone || '',
      office: labour.office || '',
      inchargerName: labour.inchargerName || ''
    };

    console.log('Returning profile:', profile);
    res.status(200).json(profile);
  } catch (error) {
    console.error('Error in route handler:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
module.exports = router;
