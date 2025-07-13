const mongoose = require("mongoose");

const labourLoginSchema = new mongoose.Schema({
  labourId: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  password: { type: String}, // optional: for debug only
  loginTime: { type: Date, default: Date.now }
});

module.exports = mongoose.model("LabourLogin", labourLoginSchema);
