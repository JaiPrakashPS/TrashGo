const express = require("express");
const router = express.Router();
const Incharger = require("../models/inchargerdetails");

// Middleware to verify incharger from cookies
const authIncharger = (req, res, next) => {
  const inchargerId = req.cookies.inchargerId;
  if (!inchargerId) {
    return res.status(401).json({ error: "Unauthorized! Please log in." });
  }
  req.inchargerId = inchargerId;
  next();
};

// Validation middleware
const validateInchargerInput = (req, res, next) => {
  const { email, phone } = req.body;
  const errors = [];

  // Email validation
  if (!email?.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)) {
    errors.push("Invalid email format. Example: name@gmail.com");
  }

  // Phone validation
  if (!phone?.match(/^[6-9]\d{9}$/)) {
    errors.push("Invalid phone number. Must be 10 digits starting with 6-9");
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

// GET: Fetch current incharger profile
router.get("/profile", authIncharger, async (req, res) => {
  try {
    const incharger = await Incharger.findOne({ inchargerId: req.inchargerId });
    if (!incharger) {
      return res.status(404).json({ error: "Incharger not found" });
    }
    res.json({
      inchargerId: incharger.inchargerId,
      name: incharger.name,
      email: incharger.email,
      phone: incharger.phone,
      office: incharger.office,
      supervisingArea: incharger.supervisingArea,
      streetNames: incharger.streetNames,
    });
  } catch (error) {
    console.error("Error fetching incharger profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST: Add incharger
router.post("/add-incharger", authIncharger, validateInchargerInput, async (req, res) => {
  try {
    const { name, email, phone, office, supervisingArea, streetNames } = req.body;

    if (!name || !email || !phone || !office || !supervisingArea || !streetNames?.length) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newIncharger = new Incharger({
      inchargerId: req.inchargerId,
      name,
      email: email.toLowerCase().trim(),
      phone,
      office,
      supervisingArea,
      streetNames,
    });

    await newIncharger.save();
    res.status(201).json({ message: "Incharger details saved", data: newIncharger });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: Object.values(error.errors).map(err => err.message) 
      });
    }
    console.error("Error adding incharger:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET: Get incharger by ID (secured)
router.get("/get/:id", authIncharger, async (req, res) => {
  try {
    const id = req.params.id.trim();
    if (id !== req.inchargerId) {
      return res.status(403).json({ error: "Unauthorized access" });
    }
    const incharger = await Incharger.findOne(
      { inchargerId: id },
      { name: 1, office: 1, supervisingArea: 1, streetNames: 1, _id: 0 }
    );
    if (!incharger) {
      return res.status(404).json({ error: "Incharger not found" });
    }
    res.status(200).json(incharger);
  } catch (error) {
    console.error("Error fetching incharger:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET: Fetch areas and streets by office
router.get("/byOfficeAndArea", async (req, res) => {
  try {
    const { office, area } = req.query;
    if (!office) return res.status(400).json({ error: "Office is required" });

    const filter = area ? { office, supervisingArea: area } : { office };

    const inchargers = await Incharger.find(filter);

    const supervisingAreas = [...new Set(inchargers.map((i) => i.supervisingArea))];
    const streetNames = [...new Set(inchargers.flatMap((i) => i.streetNames))];

    res.json({ supervisingAreas, streetNames });
  } catch (error) {
    console.error("Error fetching areas and streets:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// GET: Match incharger
router.get("/matchIncharger", async (req, res) => {
  const { office, area, street } = req.query;

  try {
    const inchargers = await Incharger.find({
      office,
      supervisingArea: area,
      streetNames: street,
    });

    const response = inchargers.map((inc) => ({
      inchargerId: inc.inchargerId,
      name: inc.name,
      email: inc.email,
      phone: inc.phone,
      office: inc.office,
      supervisingArea: inc.supervisingArea,
      streetNames: inc.streetNames,
    }));

    res.json(response);
  } catch (error) {
    console.error("Error matching incharger:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;