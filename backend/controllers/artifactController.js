
import Artifact from "../models/Artifact.js";
import Incident from "../models/Incident.js";
import { logActivity } from "../services/activityService.js";

// Validate MongoDB ObjectId
const isValidObjectId = (id) => {
    return (
        typeof id === "string" &&
        /^[a-fA-F0-9]{24}$/.test(id)
    );
};

// Allowed artifact types
const allowedTypes = [
    "URL",
    "IP Address",
    "Domain",
    "Email",
    "File",
    "Hash",
    "Log",
    "Other"
];

// Add artifact to an incident
export const createArtifact = async (req, res) => {
    try {
        const { incidentId } = req.params;

        // Validate incident ID
        if (!isValidObjectId(incidentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid incident ID."
            });
        }

        // Validate request body
        if (
            !req.body ||
            typeof req.body !== "object" ||
            Array.isArray(req.body)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid request data."
            });
        }

        const {
            type,
            name,
            value,
            description,
            source
        } = req.body;

        // Validate required fields
        if (
            typeof type !== "string" ||
            typeof name !== "string" ||
            typeof value !== "string" ||
            !type.trim() ||
            !name.trim() ||
            !value.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Type, name and value are required."
            });
        }

        // Validate artifact type
        if (!allowedTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid artifact type."
            });
        }

        // Validate field lengths
        if (
            name.trim().length > 150 ||
            value.trim().length > 5000
        ) {
            return res.status(400).json({
                success: false,
                message: "Artifact name or value exceeds the allowed length."
            });
        }

        // Validate optional description
        if (
            description !== undefined &&
            (typeof description !== "string" ||
                description.length > 3000)
        ) {
            return res.status(400).json({
                success: false,
                message: "Description must be text and cannot exceed 3000 characters."
            });
        }

        // Validate optional source
        if (
            source !== undefined &&
            (typeof source !== "string" ||
                source.length > 100)
        ) {
            return res.status(400).json({
                success: false,
                message: "Source must be text and cannot exceed 100 characters."
            });
        }

        // Check whether the incident belongs to this user
        const incident = await Incident.findOne({
            _id: incidentId,
            user: req.user.id
        });

        if (!incident) {
            return res.status(404).json({
                success: false,
                message: "Incident not found."
            });
        }

        // Save artifact using only permitted fields
        const artifact = await Artifact.create({
            incident: incident._id,
            user: req.user.id,
            type: type.trim(),
            name: name.trim(),
            value: value.trim(),
            description: description?.trim() || "",
            source: source?.trim() || ""
        });

        // Record artifact addition
        await logActivity({
            incidentId: incident._id,
            userId: req.user.id,
            action: "ARTIFACT_ADDED",
            description: `Artifact added: ${artifact.name} (${artifact.type})`
        });

        return res.status(201).json({
            success: true,
            message: "Artifact added successfully.",
            artifact
        });

    } catch (error) {
        console.error("Create Artifact Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to add artifact."
        });
    }
};

// Get all artifacts of an incident
export const getArtifacts = async (req, res) => {
    try {
        const { incidentId } = req.params;

        // Validate incident ID
        if (!isValidObjectId(incidentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid incident ID."
            });
        }

        // Verify incident ownership
        const incident = await Incident.findOne({
            _id: incidentId,
            user: req.user.id
        });

        if (!incident) {
            return res.status(404).json({
                success: false,
                message: "Incident not found."
            });
        }

        // Fetch only this user's artifacts
        const artifacts = await Artifact.find({
            incident: incident._id,
            user: req.user.id
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: artifacts.length,
            artifacts
        });

    } catch (error) {
        console.error("Fetch Artifacts Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch artifacts."
        });
    }
};

// Delete an artifact
export const deleteArtifact = async (req, res) => {
    try {
        const { incidentId, artifactId } = req.params;

        // Validate incident ID
        if (!isValidObjectId(incidentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid incident ID."
            });
        }

        // Validate artifact ID
        if (!isValidObjectId(artifactId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid artifact ID."
            });
        }

        // Verify incident ownership
        const incident = await Incident.findOne({
            _id: incidentId,
            user: req.user.id
        });

        if (!incident) {
            return res.status(404).json({
                success: false,
                message: "Incident not found."
            });
        }

        // Find artifact belonging to this user and incident
        const artifact = await Artifact.findOne({
            _id: artifactId,
            incident: incident._id,
            user: req.user.id
        });

        if (!artifact) {
            return res.status(404).json({
                success: false,
                message: "Artifact not found."
            });
        }

        // Store artifact details before deletion
        const artifactName = artifact.name;
        const artifactType = artifact.type;

        // Delete artifact
        const deletedArtifact = await Artifact.findOneAndDelete({
            _id: artifactId,
            incident: incident._id,
            user: req.user.id
        });

        if (!deletedArtifact) {
            return res.status(404).json({
                success: false,
                message: "Artifact not found."
            });
        }

        // Record artifact deletion
        await logActivity({
            incidentId: incident._id,
            userId: req.user.id,
            action: "ARTIFACT_DELETED",
            description: `Artifact deleted: ${artifactName} (${artifactType})`
        });

        return res.status(200).json({
            success: true,
            message: "Artifact deleted successfully."
        });

    } catch (error) {
        console.error("Delete Artifact Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete artifact."
        });
    }
};
