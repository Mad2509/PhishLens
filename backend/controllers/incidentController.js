
import Incident from "../models/Incident.js";
import Activity from "../models/Activity.js";
import { logActivity } from "../services/activityService.js";
import Analysis from "../models/Analysis.js";
import Artifact from "../models/Artifact.js";
import { extractIOCs } from "../services/iocExtractionService.js";


// Validate MongoDB ObjectId
const isValidObjectId = (id) => {
    return (
        typeof id === "string" &&
        /^[a-fA-F0-9]{24}$/.test(id)
    );
};

// Allowed incident values
const allowedSeverities = ["Low", "Medium", "High", "Critical"];

const allowedStatuses = [
    "Open",
    "Investigating",
    "Pending",
    "Escalated",
    "Resolved",
    "Closed"
];

// Create a new incident
export const createIncident = async (req, res) => {
    try {
        const {
            title,
            description,
            severity,
            status,
            notes,
            analysisId
        } = req.body;

        // Validate required text fields
        if (
            typeof title !== "string" ||
            typeof description !== "string" ||
            !title.trim() ||
            !description.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Title and description are required."
            });
        }

        // Validate text lengths
        if (
            title.trim().length > 150 ||
            description.trim().length > 2000
        ) {
            return res.status(400).json({
                success: false,
                message: "Title or description exceeds the allowed length."
            });
        }

        // Validate optional notes
        if (
            notes !== undefined &&
            (typeof notes !== "string" || notes.length > 5000)
        ) {
            return res.status(400).json({
                success: false,
                message: "Notes must be text and cannot exceed 5000 characters."
            });
        }

        // Validate severity
        if (
            severity !== undefined &&
            (typeof severity !== "string" ||
                !allowedSeverities.includes(severity))
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid incident severity."
            });
        }

        // Validate status
        if (
            status !== undefined &&
            (typeof status !== "string" ||
                !allowedStatuses.includes(status))
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid incident status."
            });
        }

        let analysis = null;

        // Verify original analysis
        if (analysisId !== undefined && analysisId !== null && analysisId !== "") {

            if (!isValidObjectId(analysisId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid analysis ID."
                });
            }

            analysis = await Analysis.findOne({
                _id: analysisId,
                user: req.user.id
            });

            if (!analysis) {
                return res.status(404).json({
                    success: false,
                    message: "Analysis not found."
                });
            }

            // Prevent duplicate investigations
            const existingIncident = await Incident.findOne({
                user: req.user.id,
                analysis: analysisId
            });

            if (existingIncident) {
                return res.status(409).json({
                    success: false,
                    message: "An investigation already exists for this analysis.",
                    incident: existingIncident
                });
            }
        }

        // Create incident
        const incident = await Incident.create({
            user: req.user.id,
            title: title.trim(),
            description: description.trim(),
            severity,
            status,
            notes: notes?.trim() || "",
            analysis: analysis ? analysis._id : null
        });

        // Log investigation creation
        await logActivity({
            incidentId: incident._id,
            userId: req.user.id,
            action: "INVESTIGATION_CREATED",
            description: analysis
                ? "Investigation created from an existing analysis."
                : "New investigation created."
        });

        // Automatically transfer extracted IOCs
        if (analysis) {
            const artifacts = extractIOCs(analysis);

            if (artifacts.length > 0) {
                const artifactsToSave = artifacts.map((artifact) => ({
                    ...artifact,
                    incident: incident._id,
                    user: req.user.id
                }));

                await Artifact.insertMany(artifactsToSave);

                // Log IOC transfer
                await logActivity({
                    incidentId: incident._id,
                    userId: req.user.id,
                    action: "IOCS_TRANSFERRED",
                    description: `${artifacts.length} extracted evidence artifacts transferred from the original analysis.`
                });
            }
        }

        return res.status(201).json({
            success: true,
            message: "Incident created successfully.",
            incident
        });

    } catch (error) {
        console.error("Incident Creation Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create incident."
        });
    }
};

// Get all incidents
export const getIncidents = async (req, res) => {
    try {
        const incidents = await Incident.find({
            user: req.user.id
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: incidents.length,
            incidents
        });

    } catch (error) {
        console.error("Fetch Incidents Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch incidents."
        });
    }
};

// Get a single incident by ID
export const getIncident = async (req, res) => {
    try {
        // Validate incident ID
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid incident ID."
            });
        }

        const incident = await Incident.findOne({
            _id: req.params.id,
            user: req.user.id
        }).populate("analysis");

        if (!incident) {
            return res.status(404).json({
                success: false,
                message: "Incident not found."
            });
        }

        return res.status(200).json({
            success: true,
            incident
        });

    } catch (error) {
        console.error("Fetch Incident Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch incident."
        });
    }
};

// Update an incident
export const updateIncident = async (req, res) => {
    try {
        // Validate incident ID
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid incident ID."
            });
        }

        const { status, severity, notes } = req.body;

        // Validate status
        if (
            status !== undefined &&
            (typeof status !== "string" ||
                !allowedStatuses.includes(status))
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid incident status."
            });
        }

        // Validate severity
        if (
            severity !== undefined &&
            (typeof severity !== "string" ||
                !allowedSeverities.includes(severity))
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid incident severity."
            });
        }

        // Validate notes
        if (
            notes !== undefined &&
            (typeof notes !== "string" || notes.length > 5000)
        ) {
            return res.status(400).json({
                success: false,
                message: "Notes must be text and cannot exceed 5000 characters."
            });
        }

        // Prevent empty update requests
        if (
            status === undefined &&
            severity === undefined &&
            notes === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "At least one field must be provided for updating."
            });
        }

        // Find the existing incident
        const existingIncident = await Incident.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!existingIncident) {
            return res.status(404).json({
                success: false,
                message: "Incident not found."
            });
        }

        // Store only allowed fields
        const updates = {};

        if (status !== undefined) {
            updates.status = status;
        }

        if (severity !== undefined) {
            updates.severity = severity;
        }

        if (notes !== undefined) {
            updates.notes = notes.trim();
        }

        // Update incident in MongoDB
        const incident = await Incident.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.user.id
            },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!incident) {
            return res.status(404).json({
                success: false,
                message: "Incident not found."
            });
        }

        // Record status changes
        if (
            status !== undefined &&
            existingIncident.status !== incident.status
        ) {
            await logActivity({
                incidentId: incident._id,
                userId: req.user.id,
                action: "STATUS_UPDATED",
                description: `Incident status changed from ${existingIncident.status} to ${incident.status}`
            });
        }

        // Record investigation notes updates
        if (
            notes !== undefined &&
            existingIncident.notes !== incident.notes
        ) {
            await logActivity({
                incidentId: incident._id,
                userId: req.user.id,
                action: "NOTES_UPDATED",
                description: "Investigation notes were updated."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Incident updated successfully.",
            incident
        });

    } catch (error) {
        console.error("Update Incident Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update incident."
        });
    }
};


// Delete an incident and its associated records
export const deleteIncident = async (req, res) => {
    try {
        // Validate incident ID
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid incident ID."
            });
        }

        // Verify that the incident belongs to the logged-in user
        const incident = await Incident.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!incident) {
            return res.status(404).json({
                success: false,
                message: "Incident not found."
            });
        }

        // Delete associated artifacts belonging to this user
        await Artifact.deleteMany({
            incident: incident._id,
            user: req.user.id
        });

        // Delete associated activity records belonging to this user
        await Activity.deleteMany({
            incident: incident._id,
            user: req.user.id
        });

        // Delete the incident after cleaning up related records
        const deletedIncident = await Incident.findOneAndDelete({
            _id: incident._id,
            user: req.user.id
        });

        if (!deletedIncident) {
            return res.status(404).json({
                success: false,
                message: "Incident not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Investigation and associated records deleted successfully."
        });

    } catch (error) {
        console.error("Delete Incident Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete investigation and associated records."
        });
    }
};

