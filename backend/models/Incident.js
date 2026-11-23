
import mongoose from "mongoose";

const incidentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        analysis: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Analysis",
                default: null
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true
        },
        severity: {
            type: String,
            enum: ["Low", "Medium", "High", "Critical"],
            default: "Medium"
        },
        status: {
    type: String,
    enum: [
        "Open",
        "Investigating",
        "Pending",
        "Escalated",
        "Resolved",
        "Closed"
    ],
    default: "Open"
},
        notes: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

const Incident = mongoose.model("Incident", incidentSchema);

export default Incident;
