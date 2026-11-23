
import mongoose from "mongoose";

const artifactSchema = new mongoose.Schema(
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

        type: {
            type: String,
            enum: [
                "URL",
                "IP Address",
                "Domain",
                "Email",
                "File",
                "Hash",
                "Log",
                "Other"
            ],
            required: true
        },

        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150
        },

        value: {
            type: String,
            required: true,
            trim: true,
            maxlength: 5000
        },

        description: {
            type: String,
            default: "",
            maxlength: 3000
        },

        source: {
            type: String,
            default: "Manually Added",
            maxlength: 100
        },

        fileName: {
            type: String,
            default: null,
            maxlength: 255
        },

        fileSize: {
            type: Number,
            default: null,
            min: 0
        },

        sha256: {
            type: String,
            default: null,
            lowercase: true,
            match: /^[a-f0-9]{64}$/
        }
    },
    {
        timestamps: true
    }
);

// Compound index for efficient user-specific incident artifact queries
artifactSchema.index({
    user: 1,
    incident: 1,
    createdAt: -1
});

const Artifact = mongoose.model("Artifact", artifactSchema);

export default Artifact;
