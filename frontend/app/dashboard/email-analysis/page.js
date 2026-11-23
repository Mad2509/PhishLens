
"use client";

import { useState } from "react";

export default function EmailAnalysis() {
      const formatValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return "Not available";
    }

    if (typeof value === "object") {
      return value.text || value.html || JSON.stringify(value);
    }

    return String(value);
  };
  const [emailFile, setEmailFile] = useState(null);
  const [submitUnknown, setSubmitUnknown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleAnalyze = async (e) => {
    e.preventDefault();

    if (!emailFile) {
      setError("Please select an EML file.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login again.");
        setLoading(false);
        return;
      }

      const formData = new FormData();

      // Add the text field before the file
      formData.append(
        "submitUnknownToVirusTotal",
        String(submitUnknown)
      );

      formData.append("emailFile", emailFile);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/analyze/email/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Email analysis failed.");
      }

      setResult(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analysis-container">

      <aside className="sidebar">
        <h2 className="dashboard-logo">
          PhishLens<span>.</span>
        </h2>

        <p className="menu-heading">MAIN MENU</p>

        <a href="/dashboard" className="side-link">📊 Dashboard</a>
        <a href="/dashboard/url-analysis" className="side-link">🔗 URL Analysis</a>
        <a href="/dashboard/email-analysis" className="side-link active">📧 Email Analysis</a>
        <a href="/dashboard/investigations" className="side-link">🔍 Investigations</a>

        <div className="sidebar-bottom">
          <a href="/" className="side-link">🏠 Home</a>
          <a href="/login" className="side-link">↪ Logout</a>
        </div>
      </aside>

      <main className="analysis-main">

        <div className="analysis-header">
          <h1>Email Analysis</h1>
          <p>Inspect suspicious emails and identify phishing indicators.</p>
        </div>

        <div className="analysis-card email-card">

          <div className="analysis-icon">📧</div>

          <h2>Analyze Email File</h2>

          <p className="analysis-description">
            Upload a suspicious .eml file to investigate
            possible phishing activity.
          </p>

          <form onSubmit={handleAnalyze}>

            <label>Select Email File (.eml)</label>

            <input
              type="file"
              accept=".eml"
              onChange={(e) => {
                setEmailFile(e.target.files[0] || null);
                setResult(null);
                setError("");
              }}
              required
            />

            <label className="vt-checkbox-label">
            <input
            type="checkbox"
            className="vt-checkbox"
            checked={submitUnknown}
            onChange={(e) => setSubmitUnknown(e.target.checked)}
            />

            <span>Submit unknown URLs to VirusTotal for scanning</span>
            </label>

            <button
              type="submit"
              className="analyze-btn"
              disabled={loading}
            >
              {loading ? "Analyzing..." : "Analyze Email →"}
            </button>

          </form>

          {error && (
            <p style={{ color: "red", marginTop: "15px" }}>
              {error}
            </p>
          )}

          <div className="analysis-note">
            <strong>Security Notice</strong>
            <p>
              Do not open suspicious links or attachments.
              Only metadata and hashes of attachments are inspected.
              Submitting URLs to VirusTotal shares them with that provider.
              Do not submit confidential URLs.
            </p>
          </div>

        </div>

        
{result && (
  <div className="email-report">

    <div className="report-header">
      <div>
        <h2>Analysis Report</h2>
        <p>PhishLens Email Security Investigation</p>
      </div>
      <span className="report-status">Analysis Complete</span>
    </div>

    <div className="report-id">
      <span>Analysis ID</span>
      <p>{result.analysisId}</p>
    </div>

    {/* Risk Summary */}
    <div className="risk-summary">

      <div className="report-stat">
        <span>Risk Score</span>
        <h2>{result.analysis.riskScore}<small>/100</small></h2>
      </div>

      <div className="report-stat">
        <span>Risk Level</span>
        <h2 className={`risk-${result.analysis.riskLevel.toLowerCase()}`}>
          {result.analysis.riskLevel}
        </h2>
      </div>

      <div className="report-stat">
        <span>Verdict</span>
        <h2>{result.analysis.verdict}</h2>
      </div>

    </div>

    {/* Email Information */}
    <div className="report-section">
      <h3>📧 Email Information</h3>

      <div className="email-details-grid">
        <div>
          <span>Subject</span>
          <p>{formatValue(result.emailDetails.subject)}</p>
        </div>

        <div>
          <span>Sender</span>
          <p>{formatValue(result.emailDetails.from)}</p>
        </div>

        <div>
          <span>Recipient</span>
          <p>{formatValue(result.emailDetails.to)}</p>
        </div>

        <div>
          <span>Reply-To</span>
          <p>{formatValue(result.emailDetails.replyTo)}</p>
        </div>

        <div>
          <span>Return Path</span>
          <p>{formatValue(result.emailDetails.returnPath)}</p>
        </div>

        <div>
          <span>Message ID</span>
          <p>{formatValue(result.emailDetails.messageId)}</p>
        </div>
      </div>
    </div>

    {/* Phishing Indicators */}
    <div className="report-section">
      <h3>🚨 Phishing Indicators</h3>

      {result.analysis.indicators.length > 0 ? (
        <ul className="indicator-list">
          {result.analysis.indicators.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>No obvious phishing indicators detected.</p>
      )}
    </div>

    {/* Extracted URLs */}
    <div className="report-section">
      <h3>🔗 Extracted URLs</h3>

      {result.extractedURLs.length > 0 ? (
        <div className="url-list">

          {result.extractedURLs.map((url, index) => {
            const intelligence = result.urlIntelligence[index];

            return (
              <div className="url-item" key={index}>

                <span className="url-number">URL {index + 1}</span>

                <p className="wrapped-url">{url}</p>

                <div className="provider-grid">
                  <div>
                    <span>VirusTotal</span>
                    <strong className={
                      intelligence?.providers?.virusTotal?.available
                        ? "provider-available"
                        : "provider-unavailable"
                    }>
                      {intelligence?.providers?.virusTotal?.available
                        ? "Available"
                        : "Unavailable"}
                    </strong>
                  </div>

                  <div>
                    <span>URLhaus</span>
                    <strong className={
                      intelligence?.providers?.urlHaus?.available
                        ? "provider-available"
                        : "provider-unavailable"
                    }>
                      {intelligence?.providers?.urlHaus?.available
                        ? "Available"
                        : "Unavailable"}
                    </strong>
                  </div>

                  <div>
                    <span>Google Safe Browsing</span>
                    <strong className={
                      intelligence?.providers?.googleSafeBrowsing?.available
                        ? "provider-available"
                        : "provider-unavailable"
                    }>
                      {intelligence?.providers?.googleSafeBrowsing?.available
                        ? "Available"
                        : "Unavailable"}
                    </strong>
                  </div>
                </div>

                <div className="threat-result">
                  <span>Confirmed Threats</span>
                  <p>
                    {intelligence?.confirmedThreats?.length > 0
                      ? intelligence.confirmedThreats.join(", ")
                      : "No threats reported"}
                  </p>
                </div>

              </div>
            );
          })}

        </div>
      ) : (
        <p>No URLs were extracted from this email.</p>
      )}
    </div>

    {/* Attachments */}
    <div className="report-section">
      <h3>📎 Email Attachments</h3>

      {result.attachments.length > 0 ? (
        <div className="attachment-list">

          {result.attachments.map((file, index) => (
            <div className="attachment-item" key={index}>
              <h4>{file.filename}</h4>

              <p><strong>File Type:</strong> {file.contentType}</p>
              <p><strong>File Size:</strong> {file.size} bytes</p>

              <span>SHA-256 Hash</span>
              <p className="wrapped-hash">{file.sha256}</p>
            </div>
          ))}

        </div>
      ) : (
        <p>No attachments found.</p>
      )}
    </div>

    <div className="report-footer">
      <strong>Security Note</strong>
      <p>
        No reported threats does not guarantee that an email or URL
        is safe. Provider availability only indicates that the
        service responded, not that the URL is harmless.
      </p>
    </div>

  </div>
)}


        <div className="info-grid">

          <div className="info-card">
            <h3>📩 Email Inspection</h3>
            <p>Examine email headers and suspicious messages.</p>
          </div>

          <div className="info-card">
            <h3>🔗 URL Extraction</h3>
            <p>Identify and enrich links included in email messages.</p>
          </div>

          <div className="info-card">
            <h3>🚨 Phishing Indicators</h3>
            <p>Detect suspicious requests and threat intelligence findings.</p>
          </div>

        </div>

      </main>
    </div>
  );
}
