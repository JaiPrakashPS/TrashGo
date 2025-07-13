const express = require('express');
const router = express.Router();
const SmartDustbin = require('../models/SmartDustbin'); // Adjust the path as necessary

// Route to verify 5-digit code
router.post('/verify-code', async (req, res) => {
    const { code, userId } = req.body;
  
    if (!/^\d{5}$/.test(code)) {
      return res.status(400).json({ success: false, message: 'Code must be a 5-digit number' });
    }
  
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
  
    try {
      const dustbin = await SmartDustbin.findOne({ code });
  
      if (!dustbin) {
        return res.status(404).json({ success: false, message: 'Invalid code' });
      }
  
      if (dustbin.smartDustbin === 'unavailable') {
        return res.status(400).json({ success: false, message: 'Smart dustbin is not available' });
      }
  
      // Update the dustbin status to unavailable and associate with user
      dustbin.smartDustbin = 'unavailable';
      dustbin.userId = userId; // Store the userId from the request
      await dustbin.save();
  
      res.json({ success: true, message: 'Smart dustbin available' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });

module.exports = router;