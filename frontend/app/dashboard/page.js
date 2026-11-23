
"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [creatingInvestigation, setCreatingInvestigation] = useState(false);
  const [creatingAnalysisId, setCreatingAnalysisId] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Investigation review form
const [selectedAnalysis, setSelectedAnalysis] = useState(null);

const [investigationTitle, setInvestigationTitle] = useState("");
const [investigationDescription, setInvestigationDescription] = useState("");
const [investigationSeverity, setInvestigationSeverity] = useState("Low");
const [investigationStatus, setInvestigationStatus] = useState("Open");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Please login first.");
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/stats`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load dashboard.");
        }

        setDashboardData(data);

      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = dashboardData?.stats || {
    totalAnalyses: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0
  };

  const recentAnalyses = dashboardData?.recentAnalyses || [];

  
    

  const getRiskClass = (riskLevel) => {
    if (riskLevel === "High") return "high-risk";
    if (riskLevel === "Medium") return "medium-risk";
    return "low-risk";
  };

  const getStatusClass = (verdict) => {
    const value = (verdict || "").toLowerCase();

    if (value.includes("phishing") || value.includes("malicious")) {
      return "detected";
    }

    if (value.includes("safe") || value.includes("no obvious")) {
      return "safe-status";
    }

    return "review";
  };

  const formatTarget = (content) => {
    if (!content) return "No content";

    const cleanedContent = content.replace(/\s+/g, " ").trim();

    if (cleanedContent.length > 65) {
      return cleanedContent.substring(0, 65) + "...";
    }

    return cleanedContent;
  };

  // Prepare investigation details for review
const reviewInvestigation = (analysis) => {
    setSelectedAnalysis(analysis);

    setInvestigationTitle(
        `${analysis.analysisType} Investigation - ${formatTarget(analysis.content)}`
    );

    setInvestigationDescription(
        `Investigation created from a ${analysis.analysisType} analysis.\n\nOriginal Content: ${analysis.content}\nRisk Score: ${analysis.riskScore}/100\nRisk Level: ${analysis.riskLevel}\nVerdict: ${analysis.verdict}`
    );

    setInvestigationSeverity(
        analysis.riskLevel === "High"
            ? "High"
            : analysis.riskLevel === "Medium"
                ? "Medium"
                : "Low"
    );

    setInvestigationStatus("Open");

    setError("");
    setSuccessMessage("");
};

  const createInvestigation = async () => {

    if (!selectedAnalysis) {
        setError("Please select an analysis first.");
        return;
    }

    if (!investigationTitle.trim()) {
        setError("Investigation title is required.");
        return;
    }

    if (!investigationDescription.trim()) {
        setError("Investigation description is required.");
        return;
    }

    try {
        setCreatingInvestigation(true);
        setCreatingAnalysisId(selectedAnalysis._id);
        setSuccessMessage("");
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
            throw new Error("Please login first.");
        }

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/incidents`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
    title: investigationTitle,
    description: investigationDescription,
    severity: investigationSeverity,
    status: investigationStatus,
    analysisId: selectedAnalysis._id
})
            }
        );

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 409 && data.incident?._id) {
                throw new Error(
                    "An investigation already exists for this analysis."
                );
            }

            throw new Error(
                data.message || "Failed to create investigation."
            );
        }

        setSuccessMessage(
            "Investigation created successfully! Extracted IOCs have been transferred to Artifacts."
        );

        setSelectedAnalysis(null);

    } catch (err) {
        setError(err.message || "Something went wrong.");

    } finally {
        setCreatingInvestigation(false);
        setCreatingAnalysisId("");
    }
};

  return (
    <div className="dashboard-container">

      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="dashboard-logo">
          PhishLens<span>.</span>
        </h2>

        <p className="menu-heading">MAIN MENU</p>

        <a href="/dashboard" className="side-link active">
          📊 Dashboard
        </a>

        <a href="/dashboard/url-analysis" className="side-link">
          🔗 URL Analysis
        </a>

        <a href="/dashboard/email-analysis" className="side-link">
          📧 Email Analysis
        </a>

        <a href="/dashboard/investigations" className="side-link">
          🔍 Investigations
        </a>

        <div className="sidebar-bottom">
          <a href="/" className="side-link">🏠 Home</a>
          <a href="/login" className="side-link">↪ Logout</a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">

        <header className="dashboard-header">
          <div>
            <h1>Analyst Dashboard</h1>
            <p>Welcome back! Here's your security overview.</p>
          </div>

          <div className="analyst-profile">
            <span className="profile-icon">M</span>
            <div>
              <strong>Security Analyst</strong>
              <p>Analyst Account</p>
            </div>
          </div>
        </header>

        {loading && (
          <p className="dashboard-message">
            Loading dashboard statistics...
          </p>
        )}

        {error && (
          <p className="dashboard-error">
            {error}
          </p>
        )}

        {successMessage && (
    <p className="success-message">
        {successMessage}
    </p>
)}

        {!loading && !error && dashboardData && (
          <>
            {/* Statistics */}
            <section className="stats-grid">

              <div className="stat-card">
                <p>Total Analyses</p>
                <h2>{stats.totalAnalyses}</h2>
                <span>All URL and email scans</span>
              </div>

              <div className="stat-card danger">
                <p>High Risk</p>
                <h2>{stats.highRisk}</h2>
                <span>High-risk results detected</span>
              </div>

              <div className="stat-card warning">
                <p>Medium Risk</p>
                <h2>{stats.mediumRisk}</h2>
                <span>Results requiring review</span>
              </div>

              <div className="stat-card safe">
                <p>Low Risk</p>
                <h2>{stats.lowRisk}</h2>
                <span>Fewer risk indicators found</span>
              </div>

            </section>


            {/* Quick Actions */}
            <section className="dashboard-section">
              <h2>Quick Actions</h2>

              <div className="quick-actions">
                <a href="/dashboard/url-analysis" className="action-card">
                  <span>🔗</span>
                  <h3>Analyze URL</h3>
                  <p>Check a suspicious website link.</p>
                </a>

                <a href="/dashboard/email-analysis" className="action-card">
                  <span>📧</span>
                  <h3>Analyze Email</h3>
                  <p>Inspect suspicious email files.</p>
                </a>

                <a href="/dashboard/investigations" className="action-card">
                  <span>🔍</span>
                  <h3>Investigations</h3>
                  <p>Review and manage security incidents.</p>
                </a>
              </div>
            </section>

            {/* Recent Activity */}
<section className="dashboard-section">
  <h2>Recent Analysis Activity</h2>

  {recentAnalyses.length > 0 ? (
    <div className="activity-table">

      <div className="activity-row table-heading">
        <span>Target</span>
        <span>Type</span>
        <span>Risk Level</span>
        <span>Verdict</span>
        <span>Action</span>
      </div>

      {recentAnalyses.map((analysis) => (
        <div className="activity-row" key={analysis._id}>
          <span title={analysis.content}>
            {formatTarget(analysis.content)}
          </span>

          <span>{analysis.analysisType}</span>

          <span className={getRiskClass(analysis.riskLevel)}>
            {analysis.riskLevel}
          </span>

          <span className={getStatusClass(analysis.verdict)}>
            {analysis.verdict}
          </span>

          <span>
            
<button
    className="create-investigation-btn"
    onClick={() => reviewInvestigation(analysis)}
    disabled={creatingInvestigation}
>
    <span>
        {creatingInvestigation ? "Processing..." : "Review & Create"}
    </span>
    <span className="button-arrow">→</span>
</button>

          </span>
        </div>
      ))}

    </div>
  ) : (
    <p className="dashboard-message">
      No analysis records found. Start by analyzing a URL or email.
    </p>
  )}
</section>

{/* Investigation Review Form */}
{selectedAnalysis && (
    <section className="dashboard-section">
        <h2>Review Investigation</h2>

        <div className="new-investigation-card">

            <div className="form-group">
                <label>Investigation Title</label>

                <input
                    type="text"
                    value={investigationTitle}
                    onChange={(e) => {
    setInvestigationTitle(e.target.value);
    setError("");
}}
                />
            </div>

            <div className="form-group">
                <label>Description</label>

                <textarea
                    rows="6"
                    value={investigationDescription}
                    onChange={(e) => {
    setInvestigationDescription(e.target.value);
    setError("");
}}
                />
            </div>

            <div className="form-group">
                <label>Severity</label>

                <select
                    value={investigationSeverity}
                    onChange={(e) =>
                        setInvestigationSeverity(e.target.value)
                    }
                >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                </select>
            </div>

            <div className="form-group">
                <label>Status</label>

                <select
                    value={investigationStatus}
                    onChange={(e) =>
                        setInvestigationStatus(e.target.value)
                    }
                >
                    <option value="Open">Open</option>
                    <option value="Investigating">Investigating</option>
                    <option value="Pending">Pending</option>
                    <option value="Escalated">Escalated</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                </select>
            </div>

            <div className="investigation-form-actions">
                <button
                    className="create-investigation-btn"
                    onClick={createInvestigation}
                    disabled={creatingInvestigation}
                >
                    {creatingInvestigation
                        ? "Creating..."
                        : "Create Investigation"}
                </button>

                
<button
    type="button"
    className="cancel-btn"
    onClick={() => setSelectedAnalysis(null)}
    disabled={creatingInvestigation}
>
    <span className="cancel-icon">×</span>
    <span>Cancel</span>
</button>

            </div>

        </div>
    </section>
)}
          </>
        )}

        <footer className="dashboard-footer">
          PhishLens Security Platform © 2026
        </footer>

      </main>
    </div>
  );
}
