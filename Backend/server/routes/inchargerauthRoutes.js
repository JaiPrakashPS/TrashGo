const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Incharger = require("../models/inchargerauth");

const router = express.Router();

// **Signup Route**
router.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if email already exists
        const existingUser = await Incharger.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email already registered" });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("Hashed Password:", hashedPassword);

        // Save new Incharger
        const newIncharger = new Incharger({ name, email, password: hashedPassword });
        await newIncharger.save();

        res.status(201).json({ message: "Signup successful", inchargerId: newIncharger.inchargerId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// **Login Route**
const authenticateIncharger = (req, res, next) => {
    if (!req.cookies.inchargerId) {
        return res.status(401).json({ error: "Unauthorized! Please log in." });
    }
    next();
};

// Login Route
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await Incharger.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid email or password" });
        }

        // Store inchargerId in cookies
        res.cookie("inchargerId", user.inchargerId, {
            httpOnly: true,
            secure: false,
            sameSite: "Lax", // 1 hour
            maxAge: 3600000
        });
        console.log("Headers Sent:", res.getHeaders());

        res.status(200).json({
            message: "Login successful",
            inchargerId: user.inchargerId
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Logout Route
router.post("/logout", (req, res) => {
    res.clearCookie("inchargerId"); // Remove inchargerId from cookies
    res.status(200).json({ message: "Logout successful" });
});

// Protected Dashboard Route (Only accessible after login)
router.get("/dashboard", authenticateIncharger, (req, res) => {
    res.json({ message: "Welcome to the Incharger Dashboard" });
});

module.exports = router;
