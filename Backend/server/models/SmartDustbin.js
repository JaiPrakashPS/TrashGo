const mongoose = require('mongoose');

const smartDustbinSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    match: [/^\d{5}$/, 'Code must be a 5-digit number'],
  },
  smartDustbin: {
    type: String,
    enum: ['available', 'unavailable'],
    default: 'available',
  },
}, { timestamps: true });

module.exports = mongoose.model('SmartDustbin', smartDustbinSchema);