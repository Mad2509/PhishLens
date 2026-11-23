
export const analyzeURL = (url) => {
    let riskScore = 0;
    let indicators = [];

    let parsedURL;

    // Check whether URL is valid
    try {
        parsedURL = new URL(url);
    } catch (error) {
        return {
            riskScore: 100,
            riskLevel: "High",
            verdict: "Invalid URL",
            indicators: ["Invalid URL format"]
        };
    }

    const hostname = parsedURL.hostname;
    const fullURL = url.toLowerCase();

    // Rule 1: Check suspicious keywords
    const suspiciousKeywords = [
        "login",
        "verify",
        "account",
        "update",
        "secure",
        "password",
        "banking"
    ];

    const foundKeywords = suspiciousKeywords.filter(
        keyword => fullURL.includes(keyword)
    );

    if (foundKeywords.length > 0) {
        riskScore += 20;
        indicators.push(
            "Suspicious keywords detected: " + foundKeywords.join(", ")
        );
    }

    // Rule 2: Check HTTP instead of HTTPS
    if (parsedURL.protocol === "http:") {
        riskScore += 10;
        indicators.push("Website does not use HTTPS");
    }

    // Rule 3: Check IP address instead of domain
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;

    if (ipPattern.test(hostname)) {
        riskScore += 30;
        indicators.push("URL uses an IP address instead of a domain");
    }

    // Rule 4: Check URL length
    if (url.length > 100) {
        riskScore += 15;
        indicators.push("Unusually long URL");
    }

    // Rule 5: Check URL shorteners
    const shorteners = [
        "bit.ly",
        "tinyurl.com",
        "t.co",
        "is.gd"
    ];

    if (shorteners.includes(hostname)) {
        riskScore += 25;
        indicators.push("URL uses a URL shortening service");
    }

    // Rule 6: Check @ symbol
    if (url.includes("@")) {
        riskScore += 25;
        indicators.push("URL contains an @ symbol");
    }

    // Keep score between 0 and 100
    riskScore = Math.min(riskScore, 100);

    // Determine risk level
    let riskLevel = "Low";
    let verdict = "No obvious phishing indicators";

    if (riskScore >= 60) {
        riskLevel = "High";
        verdict = "Likely Phishing";
    } else if (riskScore >= 30) {
        riskLevel = "Medium";
        verdict = "Suspicious";
    }

    return {
        riskScore,
        riskLevel,
        verdict,
        indicators
    };
};
