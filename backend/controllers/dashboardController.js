
import Analysis from "../models/Analysis.js";

export const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get total number of analyses
        const totalAnalyses = await Analysis.countDocuments({
            user: userId
        });

        // Count high-risk analyses
        const highRisk = await Analysis.countDocuments({
            user: userId,
            riskLevel: "High"
        });

        // Count medium-risk analyses
        const mediumRisk = await Analysis.countDocuments({
            user: userId,
            riskLevel: "Medium"
        });

        // Count low-risk analyses
        const lowRisk = await Analysis.countDocuments({
            user: userId,
            riskLevel: "Low"
        });

        // Get five most recent analyses
        const recentAnalyses = await Analysis.find({
            user: userId
        })
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({
            success: true,
            stats: {
                totalAnalyses,
                highRisk,
                mediumRisk,
                lowRisk
            },
            recentAnalyses
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard statistics",
            error: error.message
        });
    }
};
