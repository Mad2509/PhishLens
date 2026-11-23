import { isIP } from "node:net";

// Extract the actual email address
const extractEmailAddress = (value) => {
    if (!value || value === "Unknown") {
        return null;
    }

    const match = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);

    return match ? match[0] : null;
};

const addURLArtifacts = (artifacts, url, source) => {
    try {
        const parsedURL = new URL(url);

        if (!["http:", "https:"].includes(parsedURL.protocol)) {
            return;
        }

        // Prevent duplicate URL artifacts
if (artifacts.some((item) => item.type === "URL" && item.value === url)) {
    return;
}

        artifacts.push({
            type: "URL",
            name: "Extracted URL",
            value: url,
            description: "URL observed during security analysis.",
            source
        });



        const hostname = parsedURL.hostname;

        if (isIP(hostname)) {
            artifacts.push({
                type: "IP Address",
                name: "URL IP Address",
                value: hostname,
                description: "IP address extracted from the URL hostname.",
                source
            });
        } else {
            artifacts.push({
                type: "Domain",
                name: "URL Domain",
                value: hostname,
                description: "Domain extracted from the URL hostname.",
                source
            });
        }

    } catch (error) {
        // Ignore invalid URLs
    }
};

// Extract IOCs from an analysis
export const extractIOCs = (analysis) => {

    const artifacts = [];

    // URL Analysis
    if (analysis.analysisType === "URL") {

       addURLArtifacts(
    artifacts,
    analysis.content,
    "URL Analysis"
);

    }

    // Email Analysis
    if (analysis.analysisType === "EMAIL") {

        const threatData = analysis.threatIntelligence || {};

        const emailDetails = threatData.emailDetails || {};

        // Extract URLs
        const urlIntelligence = threatData.urlIntelligence || [];

        urlIntelligence.forEach((item) => {

           if (item.url) {
    addURLArtifacts(
        artifacts,
        item.url,
        "Email Analysis"
    );
}

        });

        // Extract sender email
const senderEmail = extractEmailAddress(emailDetails.from);

if (senderEmail) {
    artifacts.push({
        type: "Email",
        name: "Sender Email",
        value: senderEmail,
        description: "Sender email address extracted from the email.",
        source: "Email Analysis"
    });
}

// Extract reply-to email
const replyToEmail = extractEmailAddress(emailDetails.replyTo);

if (replyToEmail) {
    artifacts.push({
        type: "Email",
        name: "Reply-To Email",
        value: replyToEmail,
        description: "Reply-To email address extracted from the email.",
        source: "Email Analysis"
    });
}

        // Extract attachments
        const attachments = threatData.attachments || [];

        attachments.forEach((file) => {

            if (file.filename) {
                artifacts.push({
                    type: "File",
                    name: "Email Attachment",
                    value: file.filename,
                    description: `Attachment extracted from email. Size: ${file.size || 0} bytes.`,
                    source: "Email Analysis",
                    fileName: file.filename,
                    fileSize: file.size || null,
                    sha256: file.sha256 || null
                });
            }

            // Store SHA-256 as a separate artifact
            if (file.sha256) {
                artifacts.push({
                    type: "Hash",
                    name: "Attachment SHA-256",
                    value: file.sha256,
                    description: "SHA-256 hash calculated from the email attachment.",
                    source: "Email Analysis"
                });
            }

        });

    }

    return artifacts;
};