
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import analysisRoutes from "./routes/analysisRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import incidentRoutes from "./routes/incidentRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";

dotenv.config();

const app = express();

// Allowed frontend origins
const allowedOrigins = [
    "http://localhost:3000",
    process.env.FRONTEND_URL
].filter(Boolean);

// CORS configuration
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
    }
}));

// Middleware
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/analyze", analysisRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/activities", activityRoutes);

// Health Check
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "PhishLens Backend is running!"
    });
});

// Start Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`PhishLens server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();
