
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const GOOGLE_API =
    "https://safebrowsing.googleapis.com/v5/urls:search";

export const checkGoogleSafeBrowsing = async (url) => {
    try {
        const params = new URLSearchParams();

        params.append(
            "key",
            process.env.GOOGLE_SAFE_BROWSING_API_KEY
        );

        params.append("urls", url);

        const response = await axios.get(GOOGLE_API, {
            params,
            timeout: 15000
        });

        const threats = response.data.threats || [];

        if (threats.length === 0) {
            return {
                available: true,
                found: false,
                message: "No matching threats found in Google Safe Browsing."
            };
        }

        return {
            available: true,
            found: true,
            threats: threats.map((item) => ({
                url: item.url,
                threatTypes: item.threatTypes || []
            }))
        };

    } catch (error) {
        console.error(
            "Google Safe Browsing Error:",
            error.response?.data || error.message
        );

        return {
            available: false,
            found: false,
            message: "Google Safe Browsing service is currently unavailable."
        };
    }
};
