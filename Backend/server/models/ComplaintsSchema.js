const mongoose = require("mongoose");

const complaintsSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (v) {
          return typeof v === "string" && v.length > 0;
        },
        message: "User ID must be a non-empty string.",
      },
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    photo: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    mainArea: {
      type: String,
      trim: true,
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved", "Rejected"],
      default: "Pending",
    },
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
          message: "Location must be an array with [longitude, latitude].",
        },
      },
    },
    assignInchargers: [
      {
        inchargerId: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        email: {
          type: String,
          required: true,
        },
        phone: {
          type: String,
          required: true,
        },
      },
    ],
    assignLabours: [
      {
        labourId: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        phoneNumber: {
          type: String,
          required: true,
        },
        inchargerId: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

complaintsSchema.index({ location: "2dsphere" });

const Complaint = mongoose.model("Complaint", complaintsSchema);

module.exports = Complaint;