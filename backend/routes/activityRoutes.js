
import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
    getActivities
} from "../controllers/activityController.js";

const router = express.Router();

// Protect activity routes
router.use(authMiddleware);

// Get activities for an incident
router.get("/:incidentId", getActivities);

export default router;
