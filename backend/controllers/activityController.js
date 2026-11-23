
import Activity from "../models/Activity.js";
import Incident from "../models/Incident.js";

// Get activities for an incident
export const getActivities = async (req, res) => {
    try {
        const { incidentId } = req.params;

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

        // Retrieve incident activities
        const activities = await Activity.find({
            incident: incidentId,
            user: req.user.id
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: activities.length,
            activities
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve activities.",
            error: error.message
        });
    }
};
