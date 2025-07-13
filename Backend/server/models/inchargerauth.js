const mongoose = require("mongoose");
// const { v4: uuidv4 } = require("uuid"); // Import UUID

const userSchema = new mongoose.Schema({
    inchargerId: { type: mongoose.Schema.Types.ObjectId, auto: true },// Generate UUID
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true }
});

const Incharger = mongoose.model("auth", userSchema);
module.exports = Incharger;

