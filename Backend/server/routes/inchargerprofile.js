const express = require("express");
const router = express.Router();
const Incharger = require("../models/inchargerdetails"); // Make sure path is correct

// ✅ GET incharger profile by inchargerId
router.get("/details/:inchargerId", async (req, res) => {
  try {
    const { inchargerId } = req.params;

    if (!inchargerId) {
      return res.status(400).json({ error: "inchargerId is required" });
    }

    const incharger = await Incharger.findOne(
      { inchargerId },
      {
        name: 1,
        email: 1,
        phone: 1,
        office: 1,
        supervisingArea: 1,
        streetNames: 1,
        _id: 0,
      }
    );

    if (!incharger) {
      return res.status(404).json({ error: "Incharger profile not found" });
    }

    res.status(200).json({ success: true, profile: incharger });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ PUT route to update incharger details by _id
router.put("/update/:inchargerId", async (req, res) => {
    try {
      const { inchargerId } = req.params;
      const updates = req.body;
  
      const updatedIncharger = await Incharger.findOneAndUpdate(
        { inchargerId },
        updates,
        { new: true }
      );
  
      if (!updatedIncharger) {
        return res.status(404).json({ error: "Incharger not found" });
      }
  
      res.status(200).json({ success: true, updatedIncharger });
    } catch (error) {
      console.error("Error updating incharger:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
module.exports = router;
