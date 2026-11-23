
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const VIRUSTOTAL_API = "https://www.virustotal.com/api/v3";

// Get a URL report from VirusTotal
const getURLReport = async (url) => {
    try {
        // Convert URL into Base64 URL ID
        const urlId = Buffer.from(url)
            .toString("base64")
            .replace(/=/g, "");

        const response = await axios.get(
            `${VIRUSTOTAL_API}/urls/${urlId}`,
            {
                headers: {
                    "x-apikey": process.env.VIRUSTOTAL_API_KEY
                }
            }
        );

        const data = response.data.data.attributes;

        return {
            available: true,
            malicious: data.last_analysis_stats?.malicious || 0,
            suspicious: data.last_analysis_stats?.suspicious || 0,
            harmless: data.last_analysis_stats?.harmless || 0,
            undetected: data.last_analysis_stats?.undetected || 0,
            total:
                (data.last_analysis_stats?.malicious || 0) +
                (data.last_analysis_stats?.suspicious || 0) +
                (data.last_analysis_stats?.harmless || 0) +
                (data.last_analysis_stats?.undetected || 0)
        };

    } catch (error) {
        if (error.response?.status === 404) {
            return {
                available: false,
                message: "URL not found in VirusTotal."
            };
        }

        console.error(
            "VirusTotal Error:",
            error.response?.data || error.message
        );

        return {
            available: false,
            message: "VirusTotal service is currently unavailable."
        };
    }
};


// Submit a URL for a new VirusTotal scan
export const submitURLForScan = async (url) => {
    try {
        const response = await axios.post(
            `${VIRUSTOTAL_API}/urls`,
            new URLSearchParams({
                url: url
            }),
            {
                headers: {
                    "x-apikey": process.env.VIRUSTOTAL_API_KEY,
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                timeout: 15000
            }
        );

        return {
            available: true,
            submitted: true,
            analysisId: response.data.data.id,
            status: "queued"
        };

    } catch (error) {
        console.error(
            "VirusTotal Submission Error:",
            error.response?.data || error.message
        );

        return {
            available: false,
            submitted: false,
            message: "Unable to submit URL to VirusTotal."
        };
    }
};


// Retrieve the submitted scan results
export const getURLAnalysis = async (analysisId) => {
    try {
        const response = await axios.get(
            `${VIRUSTOTAL_API}/analyses/${analysisId}`,
            {
                headers: {
                    "x-apikey": process.env.VIRUSTOTAL_API_KEY
                },
                timeout: 15000
            }
        );

        const data = response.data.data.attributes;

        return {
            available: true,
            status: data.status,
            stats: data.stats || {},
            results: data.results || {}
        };

    } catch (error) {
        console.error(
            "VirusTotal Analysis Error:",
            error.response?.data || error.message
        );

        return {
            available: false,
            message: "Unable to retrieve VirusTotal scan results."
        };
    }
};


export { getURLReport };
