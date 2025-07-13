const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const streamifier = require("streamifier");
const cloudinary = require("../../config/cloudinaryConfig");
const Complaint = require("../../models/ComplaintsSchema");
const User = require("../../models/UserSchema");
const InchargerDetails = require("../../models/inchargerdetails");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();

// Use memoryStorage for multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper function to upload image to Cloudinary
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// API: Validate Image Content
router.post("/validate-image", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded." });
    }

    console.log("📤 Validating image with Gemini...");
    const buffer = req.file.buffer;

    // Convert buffer to base64 and log for debugging
    const base64Image = buffer.toString("base64");
    console.log("📸 Base64 Image Length:", base64Image.length);

    const prompt = "Analyze this image and determine if it contains trash or garbage. Respond with 'yes' if it does, 'no' if it does not, and provide a brief reason.";
    const result = await model.generateContent([prompt, { inlineData: { data: base64Image, mimeType: "image/jpeg" } }]);
    const response = await result.response;
    const aiResponse = response.text().toLowerCase();

    console.log("🎯 Gemini Response:", aiResponse);

    const isTrash = aiResponse.includes("yes");
    const reason = aiResponse.split("yes").pop().trim() || aiResponse.split("no").pop().trim();

    console.log("🔍 Validation Result - isTrash:", isTrash, "Reason:", reason); // Add debug log

    if (isTrash) {
      console.log("✅ Sending valid response with 200 status");
      return res.status(200).json({ valid: true, message: "Image contains trash or garbage.", reason });
    } else {
      console.log("❌ Sending invalid response with 400 status");
      return res.status(400).json({ valid: false, message: "Image does not contain trash or garbage.", reason });
    }
  } catch (error) {
    console.error("❌ Image Validation Error:", error.message, error.stack);
    if (error.name === "GoogleGenerativeAIError" && error.message.includes("API key not valid")) {
      res.status(500).json({ message: "Invalid Gemini API key. Please check your .env file." });
    } else {
      res.status(500).json({ message: "Server error during image validation.", error: error.message });
    }
  }
});

// API: Get All Supervising Areas
router.get("/supervising-areas", async (req, res) => {
  try {
    console.log("📂 Fetching all supervising areas...");
    const supervisingAreas = await InchargerDetails.find({}, { supervisingArea: 1, _id: 0 }).distinct("supervisingArea");

    if (!supervisingAreas || supervisingAreas.length === 0) {
      console.log("⚠ No supervising areas found.");
      return res.status(404).json({ message: "No supervising areas found." });
    }

    console.log("✅ Supervising areas retrieved:", supervisingAreas.length);
    res.status(200).json({ supervisingAreas });
  } catch (error) {
    console.error("❌ Fetch Supervising Areas Error:", error.message, error.stack);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

// API: Submit a Complaint
router.post("/add", upload.single("photo"), async (req, res) => {
  try {
    console.log("📩 Complaint submission request received");
    console.log("📥 Request body:", req.body);

    const { userId, address, description, longitude, latitude, mainArea } = req.body;

    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      console.error("❌ Invalid or missing User ID:", userId);
      return res.status(400).json({ message: "Invalid or missing User ID." });
    }

    const user = await User.findOne({ userId: userId });

    if (!user) {
      console.error("❌ User not found in database for userId:", userId);
      return res.status(404).json({ message: "User not found." });
    }

    console.log("✅ User found:", user.name, "Details:", {
      _id: user._id.toString(),
      userId: user.userId.toString(),
      phoneNumber: user.phoneNumber,
    });

    if (!req.file || !address || !description || !longitude || !latitude || !mainArea) {
      console.error("❌ Missing required fields:", {
        hasFile: !!req.file,
        address,
        description,
        longitude,
        latitude,
        mainArea,
      });
      return res.status(400).json({ message: "All fields are required, including an image and main area." });
    }

    const parsedLongitude = parseFloat(longitude);
    const parsedLatitude = parseFloat(latitude);
    if (isNaN(parsedLongitude) || isNaN(parsedLatitude)) {
      console.error("❌ Invalid longitude or latitude:", longitude, latitude);
      return res.status(400).json({ message: "Invalid longitude or latitude values." });
    }

    const incharger = await InchargerDetails.findOne({ supervisingArea: mainArea });

    if (!incharger) {
      console.error("❌ No incharger found for supervisingArea:", mainArea);
      return res.status(404).json({ message: `No incharger found for supervising area: ${mainArea}.` });
    }

    console.log("✅ Incharger found:", incharger.name, "Details:", {
      inchargerId: incharger.inchargerId,
      supervisingArea: incharger.supervisingArea,
    });

    console.log("📤 Uploading image to Cloudinary...");
    const result = await uploadToCloudinary(req.file.buffer);

    if (!result || !result.secure_url) {
      console.error("❌ Image upload to Cloudinary failed!");
      return res.status(500).json({ message: "Image upload failed." });
    }

    const photoUrl = result.secure_url;
    console.log("✅ Image uploaded successfully:", photoUrl);

    const assignInchargers = [
      {
        inchargerId: incharger.inchargerId,
        name: incharger.name,
        email: incharger.email,
        phone: incharger.phone,
      },
    ];

    const assignLabours = user.assignedLabours
      ? user.assignedLabours.map((labour) => ({
          labourId: labour.labourId || "",
          name: labour.name || "",
          phoneNumber: labour.phoneNumber || "",
          inchargerId: labour.inchargerId || "",
        }))
      : [];

    const newComplaint = new Complaint({
      user: userId,
      userName: user.name,
      photo: photoUrl,
      address,
      description,
      mainArea,
      location: {
        type: "Point",
        coordinates: [parsedLongitude, parsedLatitude],
      },
      assignInchargers,
      assignLabours,
    });

    await newComplaint.save();
    console.log("✅ Complaint saved successfully:", newComplaint._id);

    res.status(201).json({
      message: "✅ Complaint submitted successfully",
      complaint: newComplaint,
    });
  } catch (error) {
    console.error("❌ Complaint Submission Error:", error.message, error.stack);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

// API: Get All Complaints for a Specific User
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      console.error("❌ Invalid or missing User ID:", userId);
      return res.status(400).json({ message: "Invalid or missing User ID." });
    }

    console.log("📂 Fetching complaints for User ID:", userId);
    const complaints = await Complaint.find({ user: userId });

    if (!complaints || complaints.length === 0) {
      console.log("⚠ No complaints found for User ID:", userId);
      return res.status(404).json({ message: "No complaints found for this user." });
    }

    console.log("✅ Complaints retrieved:", complaints.length);
    res.status(200).json(complaints);
  } catch (error) {
    console.error("❌ Fetch Complaints Error:", error.message, error.stack);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

router.get("/recent", async (req, res) => {
  try {
    console.log("📂 Fetching recent complaints for user...");
    const { userId } = req.query;

    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      console.error("❌ Invalid or missing User ID:", userId);
      return res.status(400).json({ message: "Invalid or missing User ID." });
    }

    const recentComplaints = await Complaint.find({ user: userId }).sort({ createdAt: -1 }).limit(10);

    if (!recentComplaints || recentComplaints.length === 0) {
      console.log("⚠ No recent complaints found for User ID:", userId);
      return res.status(404).json({ message: "No recent complaints found for this user." });
    }

    console.log("✅ Recent complaints retrieved:", recentComplaints.length);
    res.status(200).json(recentComplaints);
  } catch (error) {
    console.error("❌ Fetch Recent Complaints Error:", error.message, error.stack);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});
router.get("/incharger/:inchargerId", async (req, res) => {
  try {
    const inchargerId = req.params.inchargerId;
    const complaints = await Complaint.find({
      "assignInchargers.inchargerId": inchargerId,
    })
      .select(
        "userName address description photo mainArea date status location assignInchargers assignLabours"
      )
      .lean();

    if (!complaints || complaints.length === 0) {
      console.log("⚠ No complaints found for Incharger ID:", inchargerId);
      return res.status(404).json({ message: "No complaints found for this incharger." });
    }

    console.log("✅ Complaints retrieved for Incharger:", complaints.length);
    res.status(200).json(complaints);
  } catch (error) {
    console.error("❌ Fetch Complaints Error:", error.message, error.stack);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      console.error("❌ Invalid or missing User ID:", userId);
      return res.status(400).json({ message: "Invalid or missing User ID." });
    }

    console.log("📂 Fetching complaints for User ID:", userId);
    const complaints = await Complaint.find({ user: userId }).lean();

    if (!complaints || complaints.length === 0) {
      console.log("⚠ No complaints found for User ID:", userId);
      return res.status(404).json({ message: "No complaints found for this user." });
    }

    console.log("✅ Complaints retrieved:", complaints.length);
    res.status(200).json(complaints);
  } catch (error) {
    console.error("❌ Fetch Complaints Error:", error.message, error.stack);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});
module.exports = router;