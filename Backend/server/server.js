// require("dotenv").config();
// const express = require("express");
// const mongoose = require("mongoose");
// const cookieParser = require("cookie-parser");

// const inchargerRoutes = require("./routes/inchargerauthRoutes");
// const InchargerDetails = require("./routes/InchargerDetails");
// const addlabourRoutes = require("./routes/addlabourRoutes");
// const allotWorkRoutes = require("./routes/allotWorkRoutes"); // Ensure this import is correct

// const app = express();
// app.use(express.json());
// app.use(cookieParser());

// mongoose.connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// })
// .then(() => console.log("MongoDB Connected"))
// .catch(err => console.log(err));

// app.use("/api/auth/incharger", inchargerRoutes);
// app.use("/api/inchargerDetails", InchargerDetails);
// app.use("/api/labours", addlabourRoutes);
// app.use("/api/allotWork", allotWorkRoutes); // THIS LINE IS CRUCIAL
// app.use("/api", addlabourRoutes);
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


// In your main app.js (where you define your Express app)
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// USER ROUTES
const Authentication = require("./routes/user/Authentication");
const Complaints = require("./routes/user/Complaints");
const Profile = require("./routes/user/Profile");
const User = require("./models/UserSchema");
const paymentRoutes = require('./routes/user/paymentRoutes'); 



// INCHARGER / LABOUR ROUTES
const inchargerRoutes = require("./routes/inchargerauthRoutes");
const InchargerDetails = require("./routes/InchargerDetails");
const inchargerprofile = require("./routes/inchargerprofile");
const labourRoutes = require("./routes/Labour/labourRoutes");
const allotWorkRoutes = require("./routes/allotworkRoutes");
const addlabourRoutes = require("./routes/addlabourRoutes");
const Allotworkcomplaints = require("./routes/Allotworkcomplaints");
const userPointsRoutes = require('./routes/user/userPointsRoutes');
const smartDustbinRoutes = require('./routes/smartDustbinRoutes');
// Import location routes
const locationRoutes = require("./routes/user/LocationRoutes");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// =============================
// 🧠 Middleware
// =============================
app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: "*", // ⚠ You should restrict this in production
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));

// Security headers
app.use((req, res, next) => {
    res.setHeader("X-Powered-By", "SecureServer");
    res.setHeader("Content-Security-Policy", "default-src 'self'");
    next();
});

// =============================
// 🔗 ROUTES
// =============================

// USER ROUTES
app.use("/api/auth", Authentication);
app.use("/api/complaints", Complaints);
app.use("/api/user", Profile);
app.use('/', Authentication);
app.use('/api', userPointsRoutes)
app.use('/api/user-points', userPointsRoutes)
app.use('/api/payments', paymentRoutes);
app.use('/api', smartDustbinRoutes);


// INCHARGER / LABOUR ROUTES
app.use("/api/auth/incharger", inchargerRoutes);
app.use("/api/incharger", InchargerDetails);
app.use("/api/inchargerDetails", InchargerDetails);
app.use("/api/inchargerprofile", inchargerprofile);
app.use("/api/labour", addlabourRoutes);
app.use("/api/allotWork", allotWorkRoutes);
app.use("/api", addlabourRoutes);
app.use("/api/labour", labourRoutes);
app.use("/api/complaints", Complaints);
app.use("/api", Allotworkcomplaints);

// Register location routes
app.use("/api/locations", locationRoutes);

// NEW ROUTE HERE
app.get('/api/usersByStreet/:selectedStreet/yesCount', async (req, res) => {
  try {
      const { selectedStreet } = req.params;

      console.log("Received request for yes user count on street:", selectedStreet);

      const yesUserCount = await User.countDocuments({
          todayStatus: { $in: ["YES", "yes"] },
          street: selectedStreet
      });

      res.json({ yesUserCount });

  } catch (error) {
      console.error("Error fetching yes user count by street:", error);
      res.status(500).json({ message: "Server error", error: error.message });
  }
});
app.get('/userLocations/:labourId/:selectedStreet', async (req, res) => {
    try {
      const { labourId, selectedStreet } = req.params;

      console.log("Received labourId:", labourId);
      console.log("Received selectedStreet:", selectedStreet);
      console.log("Hello");

      // Count the number of users with the given labourId, status, and street
      const userCount = await User.countDocuments({
          'assignedLabours.labourId': labourId, // Matching labourId
          todayStatus: { $in: ["YES", "yes"] },  // Matching todayStatus (case-insensitive)
          street: selectedStreet                  // Matching street
      });

      // Send the response with the number of matching users
      res.json({ userCount });

  } catch (error) {
      console.error("Error fetching user locations:", error);
      res.status(500).json({ message: "Server error", error: error.message });
  }
});

// User Collection Confirmation Route
app.put("/api/allotWork/update/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { allotmentId, confirmed } = req.body;

    const allotment = await AllotWork.findById(allotmentId);
    if (!allotment) {
      return res.status(404).json({ message: "Allotment not found" });
    }

    // Find the user's location data in the allotment
    const userLocation = allotment.locationData.find(loc => loc.userId === userId);
    if (!userLocation) {
      return res.status(404).json({ message: "User location not found in allotment" });
    }

    // Update the user's location status and set collection confirmed
    userLocation.todayStatus = "Collected";
    userLocation.collectionConfirmed = true;
    userLocation.confirmedAt = new Date();

    // If labour has already marked collection and user confirms
    if (allotment.labourCollected) {
      userLocation.collectionVerified = true;
    }

    // Check if all users have confirmed collection
    const allConfirmed = allotment.locationData.every(loc => 
      loc.todayStatus === "Collected" && loc.collectionConfirmed
    );

    // Only change to "Collected" if both labour marked and all users confirmed
    if (allConfirmed && allotment.labourCollected) {
      allotment.status = "Collected";
    } else {
      allotment.status = "PendingAcknowledgment";
    }

    await allotment.save();

    // Update User's today status
    await User.findOneAndUpdate(
      { userId },
      { todayStatus: "NO" }
    );

    res.status(200).json({ 
      message: "Collection confirmed successfully",
      status: allotment.status,
      userConfirmed: true,
      labourCollected: allotment.labourCollected
    });
  } catch (error) {
    console.error("Error confirming collection:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// =============================
// 🔄 PATCH: Update Today Status
// =============================
app.patch("/api/user/today-status/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const { status } = req.body;

        console.log("Received update request for userId:", userId, "with status:", status); // Debug log

        if (!["YES", "NO"].includes(status)) {
            return res.status(400).json({ message: "❌ Invalid status value" });
        }

        const user = await User.findOneAndUpdate(
            { userId }, // Query by userId field
            { todayStatus: status },
            { new: true }
        );

        if (!user) {
            console.log("User not found with userId:", userId); // Debug log
            return res.status(404).json({ message: "❌ User not found with the provided userId" });
        }

        console.log("✅ Updated user status:", user);
        res.status(200).json({ message: "Status updated", todayStatus: user.todayStatus });
    } catch (error) {
        console.error("❌ Error updating today status:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
app.get('/api/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      console.log("Fetching user with userId:", userId); // Debug log
  
      const user = await User.findOne({ userId: userId }); // Query by custom userId
      if (!user) {
        return res.status(404).json({ message: "User not found with the provided userId" });
      }
  
      const userResponse = {
        todayStatus: user.todayStatus || "NO",
        street: user.street,
        inchargerId: user.assignedIncharger.inchargerId || null,
      };
  
      console.log("User found:", userResponse);
      res.status(200).json(userResponse);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });

// =============================
// 📦 MongoDB Connect
// =============================
const connectDB = async () => {
    if (!MONGO_URI) {
        console.error("❌ MONGO_URI is missing in .env file!");
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("✅ MongoDB Connected");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err);
        setTimeout(connectDB, 5000);
    }
};

connectDB();

// =============================
// 🚀 Start Server
// =============================
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});