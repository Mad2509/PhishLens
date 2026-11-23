
import { simpleParser } from "mailparser";
import crypto from "crypto";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_ATTACHMENTS = 20;
const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
const MAX_EXTRACTED_URLS = 50;

// Extract and clean URLs
const extractURLs = (content) => {
    const urlPattern = /https?:\/\/[^\s<>"']+/gi;

    const matches = content.match(urlPattern) || [];

    const uniqueURLs = new Set();

    for (const match of matches) {
        if (uniqueURLs.size >= MAX_EXTRACTED_URLS) {
            break;
        }

        const cleanedURL = match
            .replace(/&amp;/gi, "&")
            .replace(/[\])},.;!?]+$/g, "");

        try {
            const parsedURL = new URL(cleanedURL);

            if (
                parsedURL.protocol === "http:" ||
                parsedURL.protocol === "https:"
            ) {
                uniqueURLs.add(parsedURL.href);
            }
        } catch {
            // Ignore invalid URLs
        }
    }

    return [...uniqueURLs];
};

// Sanitize attachment filename
const sanitizeFilename = (filename) => {
    if (typeof filename !== "string" || !filename.trim()) {
        return "Unknown";
    }

    return filename
        .replace(/[\\/\0]/g, "_")
        .slice(0, 255);
};

// Parse uploaded EML file
export const parseEMLFile = async (fileBuffer) => {
    try {
        // Validate uploaded buffer
        if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
            return {
                success: false,
                message: "Invalid or empty email file."
            };
        }

        // Enforce file size
        if (fileBuffer.length > MAX_FILE_SIZE) {
            return {
                success: false,
                message: "Email file exceeds the 5 MB limit."
            };
        }

        // Parse email
        const parsedEmail = await simpleParser(fileBuffer);

        // Check whether the file contains email headers
        if (
            !parsedEmail.headers ||
            parsedEmail.headers.size === 0
        ) {
            return {
                success: false,
                message: "Invalid EML file. Email headers are missing."
            };
        }

        // Extract email content
        const textBody =
            typeof parsedEmail.text === "string"
                ? parsedEmail.text
                : "";

        const htmlBody =
            typeof parsedEmail.html === "string"
                ? parsedEmail.html
                : "";

        // Extract URLs from email content
        const emailContent = [
            textBody,
            htmlBody
        ].join("\n");

        const extractedURLs = extractURLs(emailContent);

        // Validate attachment count
        const emailAttachments = parsedEmail.attachments || [];

        if (emailAttachments.length > MAX_ATTACHMENTS) {
            return {
                success: false,
                message: "Email contains too many attachments."
            };
        }

        // Calculate total attachment size
        let totalAttachmentSize = 0;

        for (const file of emailAttachments) {
            if (!Buffer.isBuffer(file.content)) {
                return {
                    success: false,
                    message: "Invalid email attachment content."
                };
            }

            totalAttachmentSize += file.content.length;

            if (totalAttachmentSize > MAX_ATTACHMENT_SIZE) {
                return {
                    success: false,
                    message: "Total attachment size exceeds 5 MB."
                };
            }
        }

        // Extract attachment metadata and SHA-256 hashes
        const attachments = emailAttachments.map((file) => {
            const hash = crypto
                .createHash("sha256")
                .update(file.content)
                .digest("hex");

            return {
                filename: sanitizeFilename(file.filename),
                contentType: file.contentType || "application/octet-stream",
                size: file.content.length,
                sha256: hash
            };
        });

        // Extract email authentication headers
        const authenticationResults =
            parsedEmail.headers.get("authentication-results") || null;

        const receivedSPF =
            parsedEmail.headers.get("received-spf") || null;

        const returnPath =
            parsedEmail.headers.get("return-path") || null;

        // Return structured email information
        return {
            success: true,

            email: {
                subject: parsedEmail.subject || "No Subject",

                from: parsedEmail.from?.text || "Unknown",

                to: parsedEmail.to?.text || "Unknown",

                replyTo: parsedEmail.replyTo?.text || null,

                date: parsedEmail.date || null,

                messageId: parsedEmail.messageId || null,

                returnPath:
                    returnPath?.text || returnPath,

                authenticationResults:
                    authenticationResults?.text || authenticationResults,

                receivedSPF:
                    receivedSPF?.text || receivedSPF,

                textBody,

                htmlBody,

                extractedURLs,

                attachments
            }
        };

    } catch (error) {
        console.error("EML Parsing Error:", error);

        return {
            success: false,
            message: "Unable to parse the uploaded EML file."
        };
    }
};
