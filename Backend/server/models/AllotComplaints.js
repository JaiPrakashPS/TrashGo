const mongoose = require("mongoose");

const locationDataSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Should map to user from Complaints, not _id
  userAddress: { type: String, required: true },
  description: { type: String, required: false },
  photoUrl: { type: String, required: false },
  date: { type: String, required: true },
  time: { type: String, required: false },
  status: { type: String, required: false },
  todayStatus: { type: String, required: false, default: "NO" },
  username: { type: String, required: true },
  latitude: { type: Number, required: false }, // Added from Complaints collection
  longitude: { type: Number, required: false }, // Added from Complaints collection
});

const allotComplaintsSchema = new mongoose.Schema({
  inchargerId: { type: String, required: true },
  inchargerName: { type: String, required: true },
  labourId: { type: String, required: true },
  labourName: { type: String, required: true },
  labourPhoneNumber: { type: String, required: true },
  street: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, required: true },
  locationData: [locationDataSchema],
}, { timestamps: true });

const AllotComplaints = mongoose.model("AllotComplaints", allotComplaintsSchema);

module.exports = AllotComplaints;