const mongoose = require("mongoose");

const inchargerSchema = new mongoose.Schema({
  inchargerId: { type: String },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  office: { type: String, required: true },
  supervisingArea: { type: String, required: true },
  streetNames: [{ type: String, required: true }],
});

module.exports = mongoose.model("inchargerdetails", inchargerSchema);
