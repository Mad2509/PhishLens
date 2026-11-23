
import express from "express";

import {
    createIncident,
    getIncidents,
    getIncident,
    updateIncident,
    deleteIncident
} from "../controllers/incidentController.js";

import {
    createArtifact,
    getArtifacts,
    deleteArtifact
} from "../controllers/artifactController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect all incident routes
router.use(authMiddleware);

// Create incident
router.post("/", createIncident);

// Get all incidents
router.get("/", getIncidents);

// Get one incident by ID
router.get("/:id", getIncident);

// Update incident
router.put("/:id", updateIncident);

// Delete incident
router.delete("/:id", deleteIncident);

// Artifact routes

// Add an artifact to an incident
router.post(
    "/:incidentId/artifacts",
    createArtifact
);

// Get all artifacts of an incident
router.get(
    "/:incidentId/artifacts",
    getArtifacts
);

// Delete an artifact
router.delete(
    "/:incidentId/artifacts/:artifactId",
    deleteArtifact
);

export default router;
