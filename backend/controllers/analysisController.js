
import Analysis from "../models/Analysis.js";
import { analyzeURL } from "../services/urlAnalyzer.js";
import { analyzeEmail } from "../services/emailAnalyzer.js";
import { getURLReport } from "../services/virusTotalService.js";
import { checkURLHaus } from "../services/urlHausService.js";
import { checkGoogleSafeBrowsing } from "../services/googleSafeBrowsingService.js";



// 1.Create Analysis


export const createAnalysis = async (req, res) => {
    try {
        const { analysisType, content } = req.body;

        if (!analysisType || !content) {
            return res.status(400).json({
                success: false,
                message: "Please provide analysis type and content"
            });
        }

        if (!["URL", "EMAIL"].includes(analysisType)) {
            return res.status(400).json({
                success: false,
                message: "Analysis type must be URL or EMAIL"
            });
        }

        let result = {
            riskScore: 0,
            riskLevel: "Low",
            verdict: "Pending",
            indicators: []
        };

        let threatIntelligence = {
            virusTotal: {
                available: false,
                message: "Not checked"
            },
            urlhaus: {
                available: false,
                message: "Not checked"
            },
            googleSafeBrowsing: {
                available: false,
                message: "Not checked"
            }
        };

        // URL analysis
        if (analysisType === "URL") {
            result = analyzeURL(content.trim());

            if (result.verdict !== "Invalid URL") {

                // 1. VirusTotal
                const vtResult = await getURLReport(content.trim());

                threatIntelligence.virusTotal = vtResult;

                if (vtResult.available) {
                    if (vtResult.malicious >= 5) {
                        result.riskScore += 40;
                        result.indicators.push(
                            `VirusTotal: ${vtResult.malicious} vendors detected this URL as malicious.`
                        );
                    } else if (vtResult.malicious > 0) {
                        result.riskScore += 25;
                        result.indicators.push(
                            `VirusTotal: ${vtResult.malicious} vendors detected this URL as malicious.`
                        );
                    }

                    if (vtResult.suspicious > 0) {
                        result.riskScore += 10;
                        result.indicators.push(
                            `VirusTotal: ${vtResult.suspicious} vendors marked this URL as suspicious.`
                        );
                    }
                }

                // 2. URLhaus
                const urlhausResult = await checkURLHaus(
                    content.trim()
                );

                threatIntelligence.urlhaus = urlhausResult;

                if (
                    urlhausResult.available &&
                    urlhausResult.found
                ) {
                    result.riskScore += 40;

                    result.indicators.push(
                        "URLhaus: URL is listed as a malware-distribution URL."
                    );

                    if (urlhausResult.threat) {
                        result.indicators.push(
                            `URLhaus threat type: ${urlhausResult.threat}`
                        );
                    }
                }

                // 3. Google Safe Browsing
                const googleResult = await checkGoogleSafeBrowsing(
                    content.trim()
                );

                threatIntelligence.googleSafeBrowsing = googleResult;

                if (
                    googleResult.available &&
                    googleResult.found
                ) {
                    result.riskScore += 40;

                    result.indicators.push(
                        "Google Safe Browsing: This URL matched a known unsafe URL."
                    );

                    googleResult.threats?.forEach((threat) => {
                        threat.threatTypes?.forEach((type) => {
                            result.indicators.push(
                                `Google Safe Browsing threat type: ${type}`
                            );
                        });
                    });
                }

                // Keep risk score between 0 and 100
                result.riskScore = Math.min(
                    result.riskScore,
                    100
                );

                // Final risk classification
                if (result.riskScore >= 60) {
                    result.riskLevel = "High";
                    result.verdict = "Potentially Malicious";
                } else if (result.riskScore >= 30) {
                    result.riskLevel = "Medium";
                    result.verdict = "Suspicious";
                } else {
                    result.riskLevel = "Low";
                    result.verdict = "No Strong Indicators Detected";
                }
            }
        }

        // Email analysis
        if (analysisType === "EMAIL") {
            result = analyzeEmail(content.trim());
        }

        // Save in MongoDB
        const analysis = await Analysis.create({
            user: req.user.id,
            analysisType,
            content: content.trim(),
            riskScore: result.riskScore,
            riskLevel: result.riskLevel,
            verdict: result.verdict,
            indicators: result.indicators,
            threatIntelligence
        });

        res.status(201).json({
            success: true,
            message: "Analysis completed successfully",
            analysis
        });

    } catch (error) {
        console.error("Analysis Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to analyze content"
        });
    }
};




// 2. Get All Analyses
export const getAnalyses = async (req, res) => {
    try {
        const analyses = await Analysis.find({
            user: req.user.id
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: analyses.length,
            analyses
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch analyses"
        });
    }
};


// 3. Get Single Analysis
export const getAnalysisById = async (req, res) => {
    try {
        const analysis = await Analysis.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!analysis) {
            return res.status(404).json({
                success: false,
                message: "Analysis not found"
            });
        }

        res.status(200).json({
            success: true,
            analysis
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch analysis"
        });
    }
};


// 4. Update Analysis
export const updateAnalysis = async (req, res) => {
    try {
        const { riskScore, riskLevel, verdict, indicators } = req.body;

        const updates = {};

        if (riskScore !== undefined) {
            if (typeof riskScore !== "number" || riskScore < 0 || riskScore > 100) {
                return res.status(400).json({
                    success: false,
                    message: "Risk score must be between 0 and 100"
                });
            }
            updates.riskScore = riskScore;
        }

        if (riskLevel !== undefined) updates.riskLevel = riskLevel;
        if (verdict !== undefined) updates.verdict = verdict;
        if (indicators !== undefined) updates.indicators = indicators;

        const analysis = await Analysis.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.user.id
            },
            updates,
            {
                new: true,
                runValidators: true
            }
        );

        if (!analysis) {
            return res.status(404).json({
                success: false,
                message: "Analysis not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Analysis updated successfully",
            analysis
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update analysis"
        });
    }
};


// 5. Delete Analysis
export const deleteAnalysis = async (req, res) => {
    try {
        const analysis = await Analysis.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });

        if (!analysis) {
            return res.status(404).json({
                success: false,
                message: "Analysis not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Analysis deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete analysis"
        });
    }
};
