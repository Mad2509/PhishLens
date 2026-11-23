
import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        analysisType: {
            type: String,
            enum: ["URL", "EMAIL"],
            required: true
        },

        content: {
            type: String,
            required: true
        },

        riskScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },

        riskLevel: {
            type: String,
            enum: ["Low", "Medium", "High"],
            default: "Low"
        },

        verdict: {
            type: String,
            default: "Pending"
        },

        indicators: {
            type: [String],
            default: []
        },

        threatIntelligence: {
        type: mongoose.Schema.Types.Mixed,
        default: null
        }
    },
    {
        timestamps: true
    }
);

const Analysis = mongoose.model("Analysis", analysisSchema);

export default Analysis;
