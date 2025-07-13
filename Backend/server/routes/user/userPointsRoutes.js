const express = require("express");
const router = express.Router();
const UserPoints = require('../../models/UserPoints');
const User = require('../../models/UserSchema');
const RewardRedemption = require('../../models/RewardRedemption');

// Middleware to validate userId
const validateUserId = async (req, res, next) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });
    if (!user) {
      console.log('User not found with userId:', req.params.userId);
      return res.status(404).json({ message: 'User not found' });
    }
    next();
  } catch (error) {
    console.error('Error validating userId:', error);
    res.status(500).json({ message: 'Server error validating user' });
  }
};

// GET /api/user-points/:userId - Get user's points
router.get('/:userId', validateUserId, async (req, res) => {
  try {
    console.log('GET /api/user-points/:userId', req.params.userId);
    const userPoints = await UserPoints.findOne({ userId: req.params.userId });
    if (!userPoints) {
      return res.status(200).json({ points: 0 });
    }
    res.status(200).json({ points: userPoints.points });
  } catch (error) {
    console.error('Error fetching points:', error);
    res.status(500).json({ message: 'Failed to fetch points', error: error.message });
  }
});

// POST /api/user-points/add/:userId - Add 50 points for recycling
router.post('/add/:userId', validateUserId, async (req, res) => {
  try {
    console.log('POST /api/user-points/add/:userId', req.params.userId);
    let userPoints = await UserPoints.findOne({ userId: req.params.userId });

    if (!userPoints) {
      userPoints = new UserPoints({ userId: req.params.userId, points: 0 });
    }

    userPoints.points += 50;
    await userPoints.save();

    res.status(200).json({
      success: true,
      message: 'Points updated successfully',
      points: userPoints.points,
    });
  } catch (error) {
    console.error('Error adding points:', error);
    res.status(500).json({ message: 'Failed to add points', error: error.message });
  }
});

// POST /api/user-points/redeem-reward - Redeem a reward
router.post('/redeem-reward', async (req, res) => {
  const { userId, rewardId, pointsRequired } = req.body;
  try {
    console.log('POST /api/user-points/redeem-reward', req.body);
    const userPoints = await UserPoints.findOne({ userId });
    if (!userPoints || userPoints.points < pointsRequired) {
      return res.status(400).json({ message: 'Insufficient points' });
    }
    userPoints.points -= pointsRequired;
    await userPoints.save();
    await new RewardRedemption({ userId, rewardId, points: pointsRequired }).save();
    res.json({ success: true });
  } catch (error) {
    console.error('Error redeeming reward:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;