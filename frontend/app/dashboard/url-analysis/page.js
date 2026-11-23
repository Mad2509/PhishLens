
"use client";

import { useState } from "react";

export default function URLAnalysis() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async (e) => {
    e.preventDefault();

    setError("");
    setResult(null);
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please login first.");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            analysisType: "URL",
            content: url.trim()
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "URL analysis failed.");
      }

      setResult(data.analysis || data);

    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // Read threat intelligence returned by the backend
  const threatIntel =
    result?.threatIntelligence ||
    result?.urlIntelligence ||
    {};

  const providers = threatIntel.providers || threatIntel;

  const virusTotal =
    providers.virusTotal ||
    providers.virustotal ||
    result?.virusTotal ||
    {};

  const urlHaus =
    providers.urlHaus ||
    providers.urlhaus ||
    result?.urlHaus ||
    {};

  const googleSafeBrowsing =
    providers.googleSafeBrowsing ||
    providers.googleSafeBrowsingResult ||
    result?.googleSafeBrowsing ||
    {};

  const formatValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return "Not available";
    }

    if (typeof value === "object") {
      return value.text || JSON.stringify(value);
    }

    return String(value);
  };

  const getProviderStatus = (provider) => {
    if (provider.available === true) return "Available";
    if (provider.available === false) return "Unavailable";
    return "Not provided";
  };

  const getProviderClass = (provider) => {
    if (provider.available === true) return "url-provider-available";
    if (provider.available === false) return "url-provider-unavailable";
    return "url-provider-unknown";
  };

  const vtStats = virusTotal.stats || virusTotal;

  return (
    <div className="analysis-container">

      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="dashboard-logo">
          PhishLens<span>.</span>
        </h2>

        <p className="menu-heading">MAIN MENU</p>

        <a href="/dashboard" className="side-link">📊 Dashboard</a>
        <a href="/dashboard/url-analysis" className="side-link active">🔗 URL Analysis</a>
        <a href="/dashboard/email-analysis" className="side-link">📧 Email Analysis</a>
        <a href="/dashboard/investigations" className="side-link">🔍 Investigations</a>

        <div className="sidebar-bottom">
          <a href="/" className="side-link">🏠 Home</a>
          <a href="/login" className="side-link">↪ Logout</a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="analysis-main">

        <div className="analysis-header">
          <h1>URL Analysis</h1>
          <p>Analyze suspicious URLs and identify potential phishing threats.</p>
        </div>

        {/* URL Input */}
        <div className="analysis-card">

          <div className="analysis-icon">🔗</div>

          <h2>Analyze a Website URL</h2>

          <p className="analysis-description">
            Enter a website URL below to check for suspicious
            patterns and potential phishing indicators.
          </p>

          <form onSubmit={handleAnalyze}>
            <label>Website URL</label>

            <input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />

            <button
              type="submit"
              className="analyze-btn"
              disabled={loading}
            >
              {loading ? "Analyzing..." : "Analyze URL →"}
            </button>
          </form>

          {error && (
            <p style={{ color: "#fb7185", marginTop: "15px" }}>
              {error}
            </p>
          )}

          <div className="analysis-note">
            <strong>Security Notice</strong>
            <p>
              PhishLens evaluates URL patterns and checks threat
              intelligence sources without opening the submitted website.
            </p>
          </div>

        </div>

        {/* Professional Analysis Report */}
        {result && (
          <div className="url-report">

            <div className="url-report-header">
              <div>
                <h2>URL Analysis Report</h2>
                <p>PhishLens Threat Investigation</p>
              </div>

              <span className="url-report-badge">
                Analysis Complete
              </span>
            </div>

            {/* Submitted URL */}
            <div className="url-submitted">
              <span>ANALYZED URL</span>
              <p>{formatValue(result.content || url)}</p>
            </div>

            {/* Risk Summary */}
            <div className="url-risk-grid">

              <div className="url-risk-card">
                <span>Risk Score</span>
                <h2>{formatValue(result.riskScore)}<small>/100</small></h2>
              </div>

              <div className="url-risk-card">
                <span>Risk Level</span>
                <h2 className={`url-risk-${String(result.riskLevel || "").toLowerCase()}`}>
                  {formatValue(result.riskLevel)}
                </h2>
              </div>

              <div className="url-risk-card">
                <span>Verdict</span>
                <h2>{formatValue(result.verdict)}</h2>
              </div>

            </div>

            {/* Detected Indicators */}
            <div className="url-report-section">
              <h3>🚨 Detected Indicators</h3>

              {result.indicators?.length > 0 ? (
                <ul className="url-indicator-list">
                  {result.indicators.map((item, index) => (
                    <li key={index}>{formatValue(item)}</li>
                  ))}
                </ul>
              ) : (
                <p>No obvious suspicious indicators detected.</p>
              )}
            </div>

            {/* Threat Intelligence */}
            <div className="url-report-section">
              <h3>🛡️ Threat Intelligence Results</h3>

              <p className="url-section-description">
                Results from external threat intelligence providers.
              </p>

              <div className="url-provider-grid">

                {/* VirusTotal */}
                <div className="url-provider-card">
                  <div className="url-provider-heading">
                    <h4>VirusTotal</h4>
                    <span className={getProviderClass(virusTotal)}>
                      {getProviderStatus(virusTotal)}
                    </span>
                  </div>

                  <div className="url-provider-stats">
                    <div>
                      <span>Malicious</span>
                      <strong>{formatValue(vtStats.malicious)}</strong>
                    </div>

                    <div>
                      <span>Suspicious</span>
                      <strong>{formatValue(vtStats.suspicious)}</strong>
                    </div>

                    <div>
                      <span>Harmless</span>
                      <strong>{formatValue(vtStats.harmless)}</strong>
                    </div>

                    <div>
                      <span>Undetected</span>
                      <strong>{formatValue(vtStats.undetected)}</strong>
                    </div>
                  </div>
                </div>

                {/* URLhaus */}
                <div className="url-provider-card">
                  <div className="url-provider-heading">
                    <h4>URLhaus</h4>
                    <span className={getProviderClass(urlHaus)}>
                      {getProviderStatus(urlHaus)}
                    </span>
                  </div>

                  <p>
                    <strong>Threat Found:</strong>{" "}
                    {urlHaus.found === true
                      ? "Yes"
                      : urlHaus.found === false
                        ? "No"
                        : "Not available"}
                  </p>

                  <p>
                    <strong>Threat Type:</strong>{" "}
                    {formatValue(urlHaus.threat)}
                  </p>

                  <p>
                    <strong>URL Status:</strong>{" "}
                    {formatValue(urlHaus.urlStatus)}
                  </p>

                  {urlHaus.tags?.length > 0 && (
                    <p>
                      <strong>Tags:</strong>{" "}
                      {urlHaus.tags.join(", ")}
                    </p>
                  )}
                </div>

                {/* Google Safe Browsing */}
                <div className="url-provider-card">
                  <div className="url-provider-heading">
                    <h4>Google Safe Browsing</h4>
                    <span className={getProviderClass(googleSafeBrowsing)}>
                      {getProviderStatus(googleSafeBrowsing)}
                    </span>
                  </div>

                  <p>
                    <strong>Threat Found:</strong>{" "}
                    {googleSafeBrowsing.found === true
                      ? "Yes"
                      : googleSafeBrowsing.found === false
                        ? "No"
                        : "Not available"}
                  </p>

                  <p>
                    <strong>Threat Types:</strong>{" "}
                    {formatValue(
                      Array.isArray(googleSafeBrowsing.threatTypes)
                        ? googleSafeBrowsing.threatTypes.join(", ")
                        : googleSafeBrowsing.threatTypes
                    )}
                  </p>
                </div>

              </div>
            </div>

            {/* Final Assessment */}
            <div className="url-report-footer">
              <strong>🔐 Security Assessment Notice</strong>
              <p>
                A low risk score or absence of reported threats does not
                guarantee that a URL is safe. Threat intelligence results
                depend on provider coverage, availability and scan freshness.
                Always investigate suspicious findings before making a decision.
              </p>
            </div>

          </div>
        )}

        {/* Information Cards */}
        <div className="info-grid">

          <div className="info-card">
            <h3>🔍 URL Structure</h3>
            <p>Examine domains, subdomains and URL length.</p>
          </div>

          <div className="info-card">
            <h3>⚠️ Suspicious Keywords</h3>
            <p>Identify suspicious words and phishing patterns.</p>
          </div>

          <div className="info-card">
            <h3>📊 Risk Assessment</h3>
            <p>Generate an explainable risk score.</p>
          </div>

        </div>

      </main>
    </div>
  );
}
