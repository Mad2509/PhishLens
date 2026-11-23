
import express from "express";
import multer from "multer";
import path from "path";

import {
    createAnalysis,
    getAnalyses,
    getAnalysisById,
    updateAnalysis,
    deleteAnalysis
} from "../controllers/analysisController.js";

import {
    analyzeEML,
    getVirusTotalScanStatus
} from "../controllers/emlAnalysisController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Configure file upload
const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    fields: 5,
    fieldSize: 10 * 1024
},

    fileFilter: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();

        // Validate file extension
        if (extension !== ".eml") {
            return cb(new Error("Only .eml files are allowed."));
        }

        // Validate the file extension.
// MIME type is not reliable for .eml files across browsers.
if (extension !== ".eml") {
    return cb(new Error("Only .eml files are allowed."));
}

cb(null, true);

        
    }
});


const handleEmailUpload = (req, res, next) => {
    upload.single("emailFile")(req, res, (error) => {

        if (error) {
            console.error("EMAIL UPLOAD ERROR:", error);

            if (error instanceof multer.MulterError) {
                if (error.code === "LIMIT_FILE_SIZE") {
                    return res.status(413).json({
                        success: false,
                        message: "Email file exceeds the 5 MB upload limit."
                    });
                }

                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            return res.status(400).json({
                success: false,
                message: error.message || "Email upload failed."
            });
        }

        console.log("UPLOADED FILE:", req.file);

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No email file received. Please select an .eml file."
            });
        }

        next();
    });
};


// Protect all analysis routes
router.use(authMiddleware);

// Upload and analyze EML file
router.post(
    "/email/upload",
    handleEmailUpload,
    analyzeEML
);

// Check VirusTotal scan status
router.get(
    "/email/virustotal/:analysisId",
    getVirusTotalScanStatus
);

// Create Analysis
router.post("/", createAnalysis);

// Get All Analyses
router.get("/", getAnalyses);

// Get Single Analysis
router.get("/:id", getAnalysisById);

// Update Analysis
router.put("/:id", updateAnalysis);

// Delete Analysis
router.delete("/:id", deleteAnalysis);

export default router;
