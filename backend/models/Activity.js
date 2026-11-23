
import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
    {
        incident: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Incident",
            required: true,
            index: true
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        action: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },

        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000
        }
    },
    {
        timestamps: true
    }
);

// Improve activity timeline queries
activitySchema.index({
    user: 1,
    incident: 1,
    createdAt: -1
});

const Activity = mongoose.model("Activity", activitySchema);

export default Activity;
