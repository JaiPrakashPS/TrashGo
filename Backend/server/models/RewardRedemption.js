// models/RewardRedemption.js
const mongoose = require('mongoose');
const rewardRedemptionSchema = new mongoose.Schema({
  userId: String,
  rewardId: String,
  points: Number,
  date: { type: Date, default: Date.now },
});
module.exports = mongoose.model('RewardRedemption', rewardRedemptionSchema);