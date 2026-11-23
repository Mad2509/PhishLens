
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const URLHAUS_API =
    "https://urlhaus-api.abuse.ch/v1/url/";

export const checkURLHaus = async (url) => {
    try {
        const response = await axios.post(
            URLHAUS_API,
            new URLSearchParams({
                url: url
            }),
            {
                headers: {
                    "Auth-Key": process.env.URLHAUS_AUTH_KEY,
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                timeout: 15000
            }
        );

        const data = response.data;

        if (data.query_status === "no_results") {
            return {
                available: true,
                found: false,
                message: "URL not found in URLhaus."
            };
        }

        if (data.query_status === "ok") {
            return {
                available: true,
                found: true,
                url: data.url,
                threat: data.threat,
                urlStatus: data.url_status,
                tags: data.tags || [],
                dateAdded: data.date_added
            };
        }

        return {
            available: false,
            message: `URLhaus query status: ${data.query_status}`
        };

    } catch (error) {
        console.error(
            "URLhaus Error:",
            error.response?.data || error.message
        );

        return {
            available: false,
            message: "URLhaus service is currently unavailable."
        };
    }
};
