
export const analyzeEmail = (emailContent) => {
    let riskScore = 0;
    let indicators = [];

    const content = emailContent.toLowerCase();

    // Rule 1: Check urgent keywords
    const urgentKeywords = [
        "urgent",
        "immediately",
        "act now",
        "account suspended",
        "limited time",
        "verify now"
    ];

    const foundUrgent = urgentKeywords.filter(
        keyword => content.includes(keyword)
    );

    if (foundUrgent.length > 0) {
        riskScore += 20;

        indicators.push(
            "Urgent language detected: " + foundUrgent.join(", ")
        );
    }

    // Rule 2: Check credential requests
    const credentialKeywords = [
        "password",
        "login credentials",
        "bank details",
        "personal information",
        "credit card"
    ];

    const foundCredentials = credentialKeywords.filter(
        keyword => content.includes(keyword)
    );

    if (foundCredentials.length > 0) {
        riskScore += 25;

        indicators.push(
            "Sensitive information requests detected: " +
            foundCredentials.join(", ")
        );
    }

    // Rule 3: Extract URLs
    const urlPattern = /https?:\/\/[^\s<>"']+/gi;
    const extractedURLs = content.match(urlPattern) || [];

    if (extractedURLs.length > 0) {
        indicators.push(
            extractedURLs.length + " URL(s) found in email"
        );
    }

    // Rule 4: Check suspicious URL patterns
    const suspiciousURLPattern =
        /(bit\.ly|tinyurl\.com|t\.co|is\.gd)/i;

    if (extractedURLs.some(url => suspiciousURLPattern.test(url))) {
        riskScore += 25;

        indicators.push(
            "Email contains a shortened URL"
        );
    }

    // Rule 5: Check payment-related keywords
    const paymentKeywords = [
        "transfer money",
        "wire transfer",
        "payment required",
        "gift card",
        "bank transfer"
    ];

    const foundPayments = paymentKeywords.filter(
        keyword => content.includes(keyword)
    );

    if (foundPayments.length > 0) {
        riskScore += 20;

        indicators.push(
            "Suspicious payment request detected"
        );
    }

    // Rule 6: Check suspicious attachment references
    const attachmentKeywords = [
        ".exe",
        ".scr",
        ".bat",
        ".js",
        ".vbs"
    ];

    const foundAttachments = attachmentKeywords.filter(
        keyword => content.includes(keyword)
    );

    if (foundAttachments.length > 0) {
        riskScore += 20;

        indicators.push(
            "Potentially dangerous attachment reference detected"
        );
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
        indicators,
        extractedURLs
    };
};
