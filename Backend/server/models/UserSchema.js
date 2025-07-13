const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, auto: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (v) {
          return /^\d{10}$/.test(v);
        },
        message: "❌ Invalid phone number! Must be exactly 10 digits.",
      },
    },
    address: { type: String, required: true },

    office: {
      type: String,
      required: true,
      enum: ["Corporation", "Village Panchayat", "Town Panchayat", "City"],
    },

    area: { type: String, required: true },
    street: { type: String, required: true, trim: true },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: function (v) {
            return v.length === 2;
          },
          message: "❌ Location must be an array with [longitude, latitude].",
        },
      },
    },

    todayStatus: {
      type: String,
      enum: ["YES", "NO"],
      default: "NO",
    },

    assignedIncharger: {
      inchargerId: { type: String }, // Ensured as string
      inchargerName: { type: String },
      inchargerEmail: { type: String },
      inchargerPhone: { type: String },
    },

    assignedLabours: [
      {
        labourId: { type: String }, // Changed to String to store labourid as string
        name: String,
        phoneNumber: String,
        inchargerId: { type: String }, // Added to store the string inchargerId from Labour
      },
    ],
  },
  { timestamps: true }
);

userSchema.index({ location: "2dsphere" });

userSchema.methods.generateToken = function () {
  return jwt.sign({ userId: this._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const User = mongoose.model("users", userSchema);
module.exports = User;