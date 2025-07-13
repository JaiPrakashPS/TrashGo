const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const labourSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneNumber: { 
    type: String, 
    required: true, 
    unique: true,
    validate: {
      validator: function(v) {
        return /^[6-9]\d{9}$/.test(v); // Validates 10 digit Indian phone numbers starting with 6-9
      },
      message: props => `${props.value} is not a valid Indian phone number! Must be 10 digits starting with 6-9.`
    }
  },
  labourWorkingArea: { type: [String], required: true }, // ✅ Labour's assigned area
  supervisingArea: { type: String, required: true },  // ✅ Separate Supervising Area
  password: { type: String, required: true },
  labourid: { type: mongoose.Schema.Types.ObjectId, auto: true },
  inchargerId: { type: String, required: true }, // ✅ Store Incharger ID
  inchargerPhone: { type: String, required: true }, 
  office: { type: String, required: true }, // ✅ Store Office Name
  inchargerName: { type: String, required: true }, // ✅ Store Incharger Name

});

// ✅ Hash password before saving
labourSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

module.exports = mongoose.model("Labour", labourSchema);