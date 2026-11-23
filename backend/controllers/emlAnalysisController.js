
import Analysis from "../models/Analysis.js";

import { parseEMLFile } from "../services/emlParserService.js";
import { analyzeEmail } from "../services/emailAnalyzer.js";

import {
    getURLReport,
    submitURLForScan,
    getURLAnalysis
} from "../services/virusTotalService.js";

import { checkURLHaus } from "../services/urlHausService.js";
import { checkGoogleSafeBrowsing } from "../services/googleSafeBrowsingService.js";


export const analyzeEML = async (req, res) => {
    try {
        // Step 1: Check uploaded file
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload an EML file."
            });
        }

        // Step 2: Parse EML file
        const parsedResult = await parseEMLFile(req.file.buffer);

        if (!parsedResult.success) {
            return res.status(400).json({
                success: false,
                message: parsedResult.message
            });
        }

        const email = parsedResult.email;

       // Step 3: Prepare plain-text email content

const plainEmailBody = email.textBody?.trim() ||
    (email.htmlBody || "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .trim();

const emailContent = [
    email.subject,
    email.from,
    email.replyTo || "",
    plainEmailBody
].filter(Boolean).join("\n\n");

        // Step 4: Analyze email content
        const analysisResult = analyzeEmail(emailContent);

        let riskScore = analysisResult.riskScore;
        let indicators = [...analysisResult.indicators];

        // Step 5: Enrich extracted URLs
        const urlIntelligence = await Promise.all(
            email.extractedURLs.map(async (url) => {

                const [
                    initialVirusTotal,
                    urlHaus,
                    googleSafeBrowsing
                ] = await Promise.all([
                    getURLReport(url),
                    checkURLHaus(url),
                    checkGoogleSafeBrowsing(url)
                ]);

                let virusTotal = initialVirusTotal;

                // Optional VirusTotal submission
                if (
                    initialVirusTotal.message ===
                        "URL not found in VirusTotal." &&
                    req.body.submitUnknownToVirusTotal === "true"
                ) {
                    const submission = await submitURLForScan(url);

                    if (submission.submitted) {
                        const scanResult = await getURLAnalysis(
                            submission.analysisId
                        );

                        virusTotal = {
                            ...scanResult,
                            submitted: true,
                            analysisId: submission.analysisId
                        };
                    } else {
                        virusTotal = {
                            ...submission,
                            originalMessage: initialVirusTotal.message
                        };
                    }
                }

                // Step 6: Identify confirmed threats
                const confirmedThreats = [];

                const vtMalicious =
                    virusTotal.malicious ??
                    virusTotal.stats?.malicious ??
                    0;

                const vtSuspicious =
                    virusTotal.suspicious ??
                    virusTotal.stats?.suspicious ??
                    0;

                if (virusTotal.available && vtMalicious > 0) {
                    confirmedThreats.push("VirusTotal");
                }

                if (urlHaus.available && urlHaus.found) {
                    confirmedThreats.push("URLhaus");
                }

                if (
                    googleSafeBrowsing.available &&
                    googleSafeBrowsing.found
                ) {
                    confirmedThreats.push("Google Safe Browsing");
                }

                // Step 7: Update risk score only once per URL
                if (confirmedThreats.length > 0) {
                    riskScore += 35;

                    indicators.push(
                        `Threat intelligence detected a malicious URL: ${url}`
                    );

                    indicators.push(
                        `Threat reported by: ${confirmedThreats.join(", ")}`
                    );

                } else if (
                    virusTotal.available &&
                    vtSuspicious > 0
                ) {
                    riskScore += 15;

                    indicators.push(
                        `VirusTotal reported suspicious activity for: ${url}`
                    );
                }

                return {
                    url,
                    providers: {
                        virusTotal,
                        urlHaus,
                        googleSafeBrowsing
                    },
                    confirmedThreats
                };
            })
        );

        // Step 8: Keep score between 0 and 100
        riskScore = Math.min(riskScore, 100);

        // Step 9: Determine final risk level
        let riskLevel = "Low";
        let verdict = "No obvious phishing indicators";

        if (riskScore >= 60) {
            riskLevel = "High";
            verdict = "Likely Phishing";
        } else if (riskScore >= 30) {
            riskLevel = "Medium";
            verdict = "Suspicious";
        }

        // Step 10: Prepare email details
        const emailDetails = {
            subject: email.subject,
            from: email.from,
            to: email.to,
            replyTo: email.replyTo,
            returnPath: email.returnPath,
            date: email.date,
            messageId: email.messageId,
            authenticationResults: email.authenticationResults,
            receivedSPF: email.receivedSPF
        };

        // Step 11: Save analysis in MongoDB
        const newAnalysis = new Analysis({
            user: req.user.id,
            analysisType: "EMAIL",
            content: emailContent,
            riskScore,
            riskLevel,
            verdict,
            indicators,
            threatIntelligence: {
                emailDetails,
                urlIntelligence,
                attachments: email.attachments
            }
        });

        await newAnalysis.save();

        // Step 12: Return complete report
        return res.status(201).json({
            success: true,
            message: "EML file analyzed and saved successfully.",

            analysisId: newAnalysis._id,

            emailDetails,

            analysis: {
                riskScore,
                riskLevel,
                verdict,
                indicators
            },

            extractedURLs: email.extractedURLs,

            urlIntelligence,

            attachments: email.attachments
        });

    } catch (error) {
        console.error("EML Analysis Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to analyze EML file."
        });
    }
};


// Get VirusTotal scan status
export const getVirusTotalScanStatus = async (req, res) => {
    try {
        const { analysisId } = req.params;

        if (!analysisId) {
            return res.status(400).json({
                success: false,
                message: "Analysis ID is required."
            });
        }

        const result = await getURLAnalysis(analysisId);

        if (!result.available) {
            return res.status(503).json({
                success: false,
                message: result.message
            });
        }

        return res.status(200).json({
            success: true,
            message: "VirusTotal scan status retrieved.",
            virusTotal: result
        });

    } catch (error) {
        console.error("VirusTotal Status Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve VirusTotal scan status."
        });
    }
};
