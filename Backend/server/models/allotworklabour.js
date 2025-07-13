const mongoose = require('mongoose');

const allotWorkSchema = new mongoose.Schema({
  inchargerId: { type: String, required: true },
  inchargerName: { type: String, required: true },
  labourId: { type: String, required: true },
  labourName: { type: String },
  labourPhoneNumber: { type: String },
  street: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'PendingAcknowledgment', 'Collected'],
    default: 'Pending',
    required: true 
  },
  locationData: [{
    userId: { type: String, default: "N/A" },
    userAddress: { type: String, default: "Address not available" },
    latitude: { type: Number, default: 0.0 },
    longitude: { type: Number, default: 0.0 },
    username: { type: String, default: "Unknown" },
    contact: { type: String, default: "N/A" },
    todayStatus: { 
      type: String, 
      enum: ['YES', 'NO'],
      default: 'NO' 
    },
    collectionAcknowledged: { type: Boolean, default: false },
    acknowledgedAt: { type: Date },
    userConfirmed: { type: Boolean, default: false },
    labourCollected: { type: Boolean, default: false },
    collectionConfirmed: { type: Boolean, default: false }
  }],
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AllotWork', allotWorkSchema);