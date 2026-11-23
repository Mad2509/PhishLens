
import Activity from "../models/Activity.js";

// Record an incident activity
export const logActivity = async ({
    incidentId,
    userId,
    action,
    description
}) => {
    try {
        await Activity.create({
            incident: incidentId,
            user: userId,
            action: action,
            description: description
        });

    } catch (error) {
        console.error("Activity logging failed:", error.message);
    }
};
