const express = require("express");
const Labour = require("../models/addlabour");
const InchargerDetails = require("../models/inchargerdetails");
const bcrypt = require("bcrypt");
const router = express.Router();

// Add Labour
router.post("/addLabour/:inchargerId", async (req, res) => {
  try {
    const { name, phoneNumber, password, labourWorkingArea } = req.body;
    const { inchargerId } = req.params;

    if (!inchargerId || !name || !phoneNumber || !password || !labourWorkingArea) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const incharger = await InchargerDetails.findOne({ inchargerId });
    if (!incharger) {
      return res.status(404).json({ error: "Incharger not found" });
    }

    const {
      office,
      supervisingArea,
      streetNames,
      name: inchargerName,
      phone: inchargerPhone,
    } = incharger;

    // Validate labourWorkingArea
    if (!labourWorkingArea.every(area => streetNames.includes(area))) {
      return res.status(400).json({ error: "Invalid working area selected." });
    }

    const existingLabour = await Labour.findOne({ phoneNumber });
    if (existingLabour) {
      return res.status(400).json({ error: "Phone number already in use." });
    }

    const newLabour = new Labour({
      name,
      phoneNumber,
      labourWorkingArea,
      supervisingArea,
      password, // Will be hashed by pre("save")
      office,
      inchargerId,
      inchargerName,
      inchargerPhone,
    });

    await newLabour.save();
    res.status(201).json({ message: "Labour added successfully", data: newLabour });
  } catch (error) {
    console.error("Error adding labour:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get Labours by Incharger
router.get("/laboursByIncharger/:inchargerId", async (req, res) => {
  try {
    const { inchargerId } = req.params;
    const labours = await Labour.find({ inchargerId });
    res.json(labours);
  } catch (err) {
    console.error("Error fetching labours:", err);
    res.status(500).json({ error: "Failed to fetch labours" });
  }
});

// Delete Labour
router.delete("/deleteLabour/:id", async (req, res) => {
  try {
    const labour = await Labour.findByIdAndDelete(req.params.id);
    if (!labour) {
      return res.status(404).json({ error: "Labour not found" });
    }
    res.json({ message: "Labour deleted successfully" });
  } catch (err) {
    console.error("Error deleting labour:", err);
    res.status(500).json({ error: "Failed to delete labour" });
  }
});

// Match Labours
router.get("/matchLabours", async (req, res) => {
  const { office, area, street } = req.query;

  if (!office || !area || !street) {
    return res.status(400).json({ error: "Missing required query parameters" });
  }

  try {
    const labours = await Labour.find({
      office,
      supervisingArea: area,
      labourWorkingArea: { $in: [street] },
    });

    const response = labours.map((labour) => ({
      labourId: labour._id.toString(),
      name: labour.name,
      phoneNumber: labour.phoneNumber,
      office: labour.office,
      supervisingArea: labour.supervisingArea,
      labourWorkingArea: labour.labourWorkingArea,
      inchargerName: labour.inchargerName,
      inchargerId: labour.inchargerId,
      inchargerPhone: labour.inchargerPhone,
    }));

    res.json(response);
  } catch (error) {
    console.error("Error matching labours:", error);
    res.status(500).json({ error: "Internal server error while matching labours" });
  }
});

// New Endpoint: Edit Labour
router.put("/editLabour/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phoneNumber, password, labourWorkingArea } = req.body;

    // Validate required fields
    if (!name || !phoneNumber || !labourWorkingArea) {
      return res.status(400).json({ error: "Name, phone number, and working area are required." });
    }

    // Check phoneNumber uniqueness (exclude current labour)
    const existingLabour = await Labour.findOne({ phoneNumber, _id: { $ne: id } });
    if (existingLabour) {
      return res.status(400).json({ error: "Phone number already in use by another labour." });
    }

    // Fetch current labour
    const labour = await Labour.findById(id);
    if (!labour) {
      return res.status(404).json({ error: "Labour not found" });
    }

    // Validate labourWorkingArea against incharger's streetNames
    const incharger = await InchargerDetails.findOne({ inchargerId: labour.inchargerId });
    if (!incharger) {
      return res.status(404).json({ error: "Incharger not found" });
    }
    const validStreets = incharger.streetNames || [];
    if (!labourWorkingArea.every(area => validStreets.includes(area))) {
      return res.status(400).json({ error: "Invalid working area selected." });
    }

    // Prepare update object
    const updates = {
      name,
      phoneNumber,
      labourWorkingArea,
    };

    // Hash password if provided
    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    // Update labour
    const updatedLabour = await Labour.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.status(200).json({ message: "Labour updated successfully", data: updatedLabour });
  } catch (error) {
    console.error("Error editing labour:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;