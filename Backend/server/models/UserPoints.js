const mongoose = require('mongoose');

const userPointsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true, // Ensures one points record per user
  },
  points: {
    type: Number,
    default: 0,
    min: 0, // Prevents negative points
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

// Pre-save hook to initialize points to 0
userPointsSchema.pre('save', function (next) {
  if (this.isNew && this.points === undefined) {
    this.points = 0;
  }
  next();
});

module.exports = mongoose.model('UserPoints', userPointsSchema);