
import express from "express";
import { getDashboardStats } from "../controllers/dashboardController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect dashboard API
router.use(authMiddleware);

// Get dashboard statistics
router.get("/stats", getDashboardStats);

export default router;
