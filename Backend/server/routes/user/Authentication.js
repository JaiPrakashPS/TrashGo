const express = require("express");
const mongoose = require("mongoose");
const User = require("../../models/UserSchema");
const Incharger = require("../../models/inchargerdetails");
const Labour = require("../../models/addlabour");
require("dotenv").config();

const router = express.Router();

// 🟢 USER REGISTRATION
router.post("/register", async (req, res) => {
  try {
    console.log("📩 Registration request received:", req.body);

    const {
      name,
      email,
      password,
      phoneNumber,
      address,
      office,
      area,
      street,
      longitude,
      latitude,
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !phoneNumber ||
      !address ||
      !office ||
      !area ||
      !street ||
      longitude === undefined ||
      latitude === undefined
    ) {
      return res.status(400).json({ message: "❌ All fields are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "❌ Invalid email format" });
    }

    if (!/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({ message: "❌ Invalid phone number! Must be exactly 10 digits." });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (existingUser) {
      return res.status(400).json({ message: "❌ Email or phone number already in use" });
    }

    const matchingInchargers = await Incharger.find({
      office: office,
      supervisingArea: area,
      streetNames: { $in: [street] },
    });

    let assignedIncharger = null;
    if (matchingInchargers.length > 0) {
      const labourMatch = await Labour.findOne({
        office: office,
        supervisingArea: area,
        labourWorkingArea: { $in: [street] },
      }).select("inchargerId inchargerName inchargerEmail inchargerPhone labourid");

      if (labourMatch && labourMatch.inchargerId) {
        assignedIncharger = {
          inchargerId: labourMatch.inchargerId,
          inchargerName: labourMatch.inchargerName || matchingInchargers[0].name,
          inchargerEmail: labourMatch.inchargerEmail || matchingInchargers[0].email,
          inchargerPhone: labourMatch.inchargerPhone || matchingInchargers[0].phoneNumber,
        };
        console.log("Assigned Incharger with inchargerId from Labour:", assignedIncharger);
      } else {
        assignedIncharger = {
          inchargerId: matchingInchargers[0]._id.toString(),
          inchargerName: matchingInchargers[0].name,
          inchargerEmail: matchingInchargers[0].email,
          inchargerPhone: matchingInchargers[0].phoneNumber,
        };
        console.log("No Labour match, using Incharger _id:", assignedIncharger);
      }
    } else {
      console.log("No matching inchargers found for office:", office, "area:", area, "street:", street);
    }

    const assignedLabours = [];
    if (assignedIncharger && assignedIncharger.inchargerId) {
      const labours = await Labour.find({
        office: office,
        supervisingArea: area,
        labourWorkingArea: { $in: [street] },
      }).select("labourid name phoneNumber inchargerId");
      console.log("Querying labours with criteria - office:", office, "area:", area, "street:", street);
      console.log("Found labours:", labours);

      if (labours.length > 0) {
        assignedLabours.push(...labours.map((labour) => ({
          labourId: labour.labourid.toString(),
          name: labour.name,
          phoneNumber: labour.phoneNumber,
          inchargerId: labour.inchargerId,
        })));
      } else {
        console.log("No labours found for the given criteria");
      }
    }

    const newUser = new User({
      name,
      email,
      password,
      phoneNumber,
      address,
      office,
      area,
      street,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      assignedIncharger: assignedIncharger || {},
      assignedLabours: assignedLabours,
    });

    await newUser.save();

    console.log("✅ Saved user:", newUser);

    res.status(201).json({
      message: "✅ User registered successfully",
      user: {
        name,
        email,
        phoneNumber,
        address,
        office,
        area,
        street,
        assignedIncharger: newUser.assignedIncharger,
        assignedLabours: newUser.assignedLabours,
      },
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({ error: "Internal server error. Please try again later." });
  }
});

router.get('/userLocations/:labourId', async (req, res) => {
  try {
    const { labourId } = req.params;
    const users = await User.find({
      'assignedLabours.labourId': labourId,
      todayStatus: { $in: ["yes", "YES"] },
    });
    const locationData = users.map(user => ({
      userId: user.userId || "N/A",
      userAddress: user.address || "Address not available",
      latitude: user.location?.coordinates[1] || 0.0,
      longitude: user.location?.coordinates[0] || 0.0,
      username: user.name || "Unknown",
      contact: user.phoneNumber || "N/A",
      todayStatus: user.todayStatus || "N/A",
    }));
    res.status(200).json(locationData);
  } catch (error) {
    console.error("Error fetching user locations:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    console.log("Received login request for phoneNumber:", phoneNumber, "password:", password); // Log input

    if (!phoneNumber || !password) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    if (!/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({ message: "Invalid phone number! Must be exactly 10 digits." });
    }

    const user = await User.findOne({ phoneNumber }).select('userId phoneNumber name street assignedIncharger.inchargerId password');
    console.log("Query result for phoneNumber:", phoneNumber, "Found user:", user); // Log query result

    if (!user) {
      return res.status(401).json({ message: "Invalid phone number or password - User not found" });
    }

    if (user.password !== password) {
      console.log("Password mismatch - Stored:", user.password, "Provided:", password);
      return res.status(401).json({ message: "Invalid phone number or password - Password mismatch" });
    }

    const userResponse = {
      message: "✅ Login successful",
      user: {
        userId: user.userId || user._id.toString(),
        phoneNumber: user.phoneNumber,
        name: user.name || "Unknown User",
        street: user.street,
        inchargerId: user.assignedIncharger.inchargerId || null,
      },
    };

    console.log("Login successful for user:", userResponse);
    res.status(200).json(userResponse);
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

router.get('/api/countUsersByStreetAndArea/:office/:area/:street', async (req, res) => {
  try {
    const { office, area, street } = req.params;

    const matchingInchargers = await Incharger.find({
      office,
      supervisingArea: area,
      streetNames: street,
    });

    if (!matchingInchargers.length) {
      return res.status(404).json({ count: 0, message: "No matching inchargers found for the provided details." });
    }

    const inchargerIds = matchingInchargers.map((inc) => inc.inchargerId);

    const userCount = await User.countDocuments({
      office,
      area,
      street,
      todayStatus: { $in: ["YES", "yes"] },
      "assignedIncharger.inchargerId": { $in: inchargerIds },
    });

    res.status(200).json({ count: userCount, message: `Users with 'YES' status under valid incharger(s): ${userCount}` });
  } catch (error) {
    console.error("Error counting users:", error);
    res.status(500).json({ count: 0, message: "Server error", error: error.message });
  }
});


// Add this to your server file (e.g., after the PATCH route)

module.exports = router;