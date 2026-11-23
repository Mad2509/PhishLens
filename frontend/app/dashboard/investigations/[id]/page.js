
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function IncidentDetails() {

  const params = useParams();
  const incidentId = params.id;

  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const [newStatus, setNewStatus] = useState("Open");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [activities, setActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // Artifact states
  const [artifacts, setArtifacts] = useState([]);
  const [artifactLoading, setArtifactLoading] = useState(true);

  const [artifactType, setArtifactType] = useState("URL");
  const [artifactName, setArtifactName] = useState("");
  const [artifactValue, setArtifactValue] = useState("");
  const [artifactDescription, setArtifactDescription] = useState("");

  const [addingArtifact, setAddingArtifact] = useState(false);

  // Fetch incident details
  const fetchIncident = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/incidents/${incidentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      console.log("Linked Analysis:", data.incident?.analysis);

      if (response.ok && data.success) {
    setIncident(data.incident);
    setNewStatus(data.incident.status);
    setNotes(data.incident.notes || "");
} else {
        setError(data.message || "Incident not found.");
      }

    } catch (err) {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch artifacts belonging to this incident
  const fetchArtifacts = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/incidents/${incidentId}/artifacts`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setArtifacts(data.artifacts);
      } else {
        alert(data.message || "Unable to fetch artifacts.");
      }

    } catch (err) {
      alert("Unable to connect to the server while fetching artifacts.");
    } finally {
      setArtifactLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
        const token = localStorage.getItem("token");

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/activities/${incidentId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (response.ok && data.success) {
            setActivities(data.activities || []);
        }

    } catch (error) {
        console.error("Error fetching activities:", error);
    } finally {
        setActivityLoading(false);
    }
};

  useEffect(() => {
    if (incidentId) {
      fetchIncident();
      fetchArtifacts();
      fetchActivities()
    }
  }, [incidentId]);

  // Start investigation
  const startInvestigation = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/incidents/${incidentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            status: "Investigating"
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setIncident(data.incident);
      } else {
        alert(data.message || "Unable to start investigation.");
      }

    } catch (err) {
      alert("Server connection failed.");
    }
  };


// Update incident status
const updateStatus = async () => {
    try {
        setUpdatingStatus(true);

        const token = localStorage.getItem("token");

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/incidents/${incidentId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: newStatus
                })
            }
        );

        const data = await response.json();

        if (response.ok && data.success) {
    setIncident(data.incident);
    setNewStatus(data.incident.status);

    await fetchActivities();

    alert("Incident status updated successfully!");
} else {
            alert(data.message || "Unable to update status.");
        }

    } catch (err) {
        alert("Server connection failed.");
    } finally {
        setUpdatingStatus(false);
    }
};


// Save investigation notes
const saveNotes = async () => {
    try {
        setSavingNotes(true);

        const token = localStorage.getItem("token");

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/incidents/${incidentId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    notes: notes
                })
            }
        );

        const data = await response.json();

        if (response.ok && data.success) {
    setIncident(data.incident);

    await fetchActivities();

    alert("Investigation notes saved successfully!");
}else {
            alert(data.message || "Unable to save notes.");
        }

    } catch (err) {
        alert("Server connection failed.");
    } finally {
        setSavingNotes(false);
    }
};



  // Add new artifact
  const addArtifact = async (e) => {
    e.preventDefault();

    if (!artifactName.trim() || !artifactValue.trim()) {
      alert("Please enter the artifact name and value.");
      return;
    }

    try {
      setAddingArtifact(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/incidents/${incidentId}/artifacts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            type: artifactType,
            name: artifactName,
            value: artifactValue,
            description: artifactDescription,
            source: "Manually Added"
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {

    alert("Artifact added successfully!");

    setArtifactName("");
    setArtifactValue("");
    setArtifactDescription("");
    setArtifactType("URL");

    fetchArtifacts();
    await fetchActivities();

} else {
        alert(data.message || "Unable to add artifact.");
      }

    } catch (err) {
      alert("Server connection failed.");
    } finally {
      setAddingArtifact(false);
    }
  };

  // Delete artifact
  const deleteArtifact = async (artifactId) => {

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this artifact?"
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
               `${process.env.NEXT_PUBLIC_API_URL}/api/incidents/${incidentId}/artifacts/${artifactId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
    alert("Artifact deleted successfully!");

    fetchArtifacts();
    await fetchActivities();
    } else {
        alert(data.message || "Unable to delete artifact.");
      }

    } catch (err) {
      alert("Server connection failed.");
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleString("en-IN");
  };

  // Export Investigation Report
const exportInvestigationReport = () => {
    window.print();
};

  if (loading) {
    return <p>Loading incident details...</p>;
  }

  if (error || !incident) {
    return (
      <div className="dashboard-main">
        <p>{error || "Incident not found."}</p>
        <Link href="/dashboard/investigations">
          Back to Investigations
        </Link>
      </div>
    );
  }

  // Copy artifact value
const copyArtifactValue = async (value) => {
    try {
        await navigator.clipboard.writeText(value);
        alert("Artifact value copied successfully!");
    } catch (error) {
        alert("Failed to copy artifact value.");
    }
};

  return (
    <div className="dashboard-container">

      <aside className="sidebar">

        <h2 className="dashboard-logo">
          PhishLens<span>.</span>
        </h2>

        <p className="menu-heading">MAIN MENU</p>

        <a href="/dashboard" className="side-link">📊 Dashboard</a>
        <a href="/dashboard/url-analysis" className="side-link">🔗 URL Analysis</a>
        <a href="/dashboard/email-analysis" className="side-link">📧 Email Analysis</a>
        <a href="/dashboard/investigations" className="side-link active">🔍 Investigations</a>

        <div className="sidebar-bottom">
          <a href="/" className="side-link">🏠 Home</a>
          <a href="/login" className="side-link">↪ Logout</a>
        </div>

      </aside>

      <main className="dashboard-main">

        <Link
          href="/dashboard/investigations"
          className="back-link"
        >
          ← Back to Investigations
        </Link>

        <header className="investigation-header">
    <div>
        <h1>{incident.title}</h1>
        <p>Incident investigation workspace</p>
    </div>

    <div style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap"
    }}>

        <span className={`status-${incident.status.toLowerCase()}`}>
            {incident.status}
        </span>

        <button
            type="button"
            onClick={exportInvestigationReport}
            className="create-case-btn"
        >
            Export Report
        </button>

    </div>
</header>

        <section className="stats-grid">

          <div className="stat-card">
            <p>Incident ID</p>
            <h2>#{incident._id.slice(-6).toUpperCase()}</h2>
            <span>Unique incident reference</span>
          </div>

          <div className="stat-card warning">
            <p>Severity</p>
            <h2>{incident.severity}</h2>
            <span>Incident priority</span>
          </div>

          <div className="stat-card">
            <p>Current Status</p>
            <h2>{incident.status}</h2>
            <span>Investigation progress</span>
          </div>

        </section>

        {/* Incident Overview */}
        <section className="dashboard-section">

          <h2>Incident Overview</h2>

          <div className="new-investigation-card">

            <div className="form-group">
              <label>Incident Title</label>
              <p>{incident.title}</p>
            </div>

            <div className="form-group">
              <label>Description</label>
              <p>{incident.description}</p>
            </div>

            <div className="form-group">
              <label>Severity</label>
              <p>{incident.severity}</p>
            </div>

            <div className="form-group">
              <label>Created On</label>
              <p>{formatDate(incident.createdAt)}</p>
            </div>

            <div className="form-group">
              <label>Last Updated</label>
              <p>{formatDate(incident.updatedAt)}</p>
            </div>

          </div>

        </section>

        {/* Original Analysis Report */}
<section className="dashboard-section">

    <h2>Original Analysis Report</h2>

    {incident.analysis ? (
        <div className="new-investigation-card">

            <div className="form-group">
                <label>Analysis Type</label>
                <p>{incident.analysis.analysisType}</p>
            </div>

            <div className="form-group">
                <label>Original Content</label>
                <p>{incident.analysis.content}</p>
            </div>

            <div className="form-group">
                <label>Risk Score</label>
                <p>{incident.analysis.riskScore}/100</p>
            </div>

            <div className="form-group">
                <label>Risk Level</label>
                <p>{incident.analysis.riskLevel}</p>
            </div>

            <div className="form-group">
                <label>Verdict</label>
                <p>{incident.analysis.verdict}</p>
            </div>

            <div className="form-group">
                <label>Indicators</label>

                {incident.analysis.indicators?.length > 0 ? (
                    <ul>
                        {incident.analysis.indicators.map((indicator, index) => (
                            <li key={index}>{indicator}</li>
                        ))}
                    </ul>
                ) : (
                    <p>No indicators recorded.</p>
                )}
            </div>

            {/* Threat Intelligence Results */}
<h3>Threat Intelligence Results</h3>

{incident.analysis.threatIntelligence?.urlIntelligence?.length > 0 ? (
    incident.analysis.threatIntelligence.urlIntelligence.map((item, index) => {
        const providers = item.providers || {};
        const vt = providers.virusTotal || {};
        const urlHaus = providers.urlHaus || {};
        const google = providers.googleSafeBrowsing || {};

        return (
            <div className="form-group" key={index}>
                <label>URL {index + 1}</label>
                <p>{item.url}</p>

                <h4>VirusTotal</h4>
                <p>
                    Status: {vt.available
                        ? "Available"
                        : "Unavailable"}
                </p>
                <p>
                    Malicious: {vt.malicious ?? vt.stats?.malicious ?? "N/A"}
                </p>
                <p>
                    Suspicious: {vt.suspicious ?? vt.stats?.suspicious ?? "N/A"}
                </p>
                <p>
                    Harmless: {vt.harmless ?? vt.stats?.harmless ?? "N/A"}
                </p>
                <p>
                    Undetected: {vt.undetected ?? vt.stats?.undetected ?? "N/A"}
                </p>

                <h4>URLhaus</h4>
                <p>
                    Status: {urlHaus.available
                        ? urlHaus.found
                            ? "Threat Found"
                            : "No Threat Found"
                        : "Unavailable"}
                </p>

                <h4>Google Safe Browsing</h4>
                <p>
                    Status: {google.available
                        ? google.found
                            ? "Threat Found"
                            : "No Threat Found"
                        : "Unavailable"}
                </p>

            </div>
        );
    })
) : (
    <p>No threat intelligence results recorded.</p>
)}

          {incident.analysis.analysisType === "EMAIL" && (
    <>
        <h3>Email Threat Intelligence</h3>

        <div className="form-group">
            <label>Subject</label>
            <p>
                {incident.analysis.threatIntelligence?.emailDetails?.subject || "Not available"}
            </p>
        </div>

        <div className="form-group">
            <label>Sender</label>
            <p>
                {incident.analysis.threatIntelligence?.emailDetails?.from || "Not available"}
            </p>
        </div>

        <div className="form-group">
            <label>Reply-To</label>
            <p>
                {incident.analysis.threatIntelligence?.emailDetails?.replyTo || "Not available"}
            </p>
        </div>

        <div className="form-group">
            <label>Authentication Results</label>
            <p>
                {incident.analysis.threatIntelligence?.emailDetails?.authenticationResults || "Not available"}
            </p>
        </div>

        <div className="form-group">
            <label>Extracted URLs</label>
            {incident.analysis.threatIntelligence?.urlIntelligence?.length > 0 ? (
                <ul>
                    {incident.analysis.threatIntelligence.urlIntelligence.map((item, index) => (
                        <li key={index}>{item.url}</li>
                    ))}
                </ul>
            ) : (
                <p>No extracted URLs recorded.</p>
            )}
        </div>

        <div className="form-group">
            <label>Email Attachments</label>
            {incident.analysis.threatIntelligence?.attachments?.length > 0 ? (
                <ul>
                    {incident.analysis.threatIntelligence.attachments.map((file, index) => (
                        <li key={index}>
                            <strong>{file.filename}</strong>
                            <p>Size: {file.size} bytes</p>
                            <p>SHA-256: {file.sha256 || "Not available"}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No attachments recorded.</p>
            )}
        </div>
    </>
)}

        </div>
    ) : (
        <div className="new-investigation-card">
            <p>No original analysis is linked to this investigation.</p>
        </div>
    )}

</section>

        
{/* Investigation Actions */}
<section className="dashboard-section no-print">

  <h2>Investigation Actions</h2>

  <div className="new-investigation-card">

    {incident.status === "Open" && (
      <>
        <p>
          This incident has not been investigated yet.
          Start the investigation to begin recording evidence
          and findings.
        </p>

        <button
          className="create-case-btn"
          onClick={startInvestigation}
        >
          Start Investigation
        </button>
      </>
    )}

    {incident.status === "Investigating" && (
      <p>
        Investigation is currently in progress.
        Evidence collection and analysis can now be performed.
      </p>
    )}

    {incident.status === "Pending" && (
      <p>
        This investigation is currently pending.
        Further action or additional information is required
        before investigation can continue.
      </p>
    )}

    {incident.status === "Escalated" && (
      <p>
        This incident has been escalated for further review
        by a higher-level security analyst or team.
      </p>
    )}

    {incident.status === "Resolved" && (
      <p>
        This incident has been resolved.
        The identified security issue has been addressed.
      </p>
    )}

    {incident.status === "Closed" && (
      <p>
        Incident Closed! This investigation has been completed
        and the incident is now officially closed.
      </p>
    )}

  </div>

</section>



{/* Manage Incident Status */}
<section className="dashboard-section no-print">

  <h2>Manage Incident Status</h2>

  <div className="new-investigation-card">

    <p>
      Update the current status of this incident as the
      investigation progresses.
    </p>

    
<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "20px"
  }}
>
  <strong>Current Status:</strong>

  <span
    style={{
      padding: "6px 14px",
      borderRadius: "20px",
      backgroundColor: "#164e63",
      color: "#67e8f9",
      fontWeight: "600"
    }}
  >
    {incident.status}
  </span>

</div>


    <div className="form-group">

      <label>Change Status</label>

      <select
        value={newStatus}
        onChange={(e) => setNewStatus(e.target.value)}
      >
        <option value="Open">Open</option>
        <option value="Investigating">Investigating</option>
        <option value="Pending">Pending</option>
        <option value="Escalated">Escalated</option>
        <option value="Resolved">Resolved</option>
        <option value="Closed">Closed</option>
      </select>

    </div>

    <button
      className="create-case-btn"
      onClick={updateStatus}
      disabled={updatingStatus || newStatus === incident.status}
    >
      {updatingStatus ? "Updating..." : "Update Status"}
    </button>

  </div>

</section>



{/* Investigation Notes */}
<section className="dashboard-section">

    <h2>Investigation Notes</h2>

    {/* Notes visible in exported PDF */}
    <div className="print-only-notes">

        <h3>Analyst Notes</h3>

        <p>
            {notes?.trim() || "No investigation notes recorded."}
        </p>

    </div>

    {/* Notes editor visible only in application */}
    <div className="new-investigation-card no-print">

        <p>
            Record your findings, observations and actions
            taken during this investigation.
        </p>

        <div className="form-group">

            <label>Analyst Notes</label>

            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter your investigation findings here..."
                rows="7"
            />

        </div>

        <button
            className="create-case-btn"
            onClick={saveNotes}
            disabled={savingNotes}
        >
            {savingNotes ? "Saving..." : "Save Investigation Notes"}
        </button>

    </div>

</section>


{/* Activity Timeline */}
<div className="incident-section activity-timeline-section">

    <h2>Activity Timeline</h2>

    {activityLoading ? (
        <p>Loading activities...</p>
    ) : activities.length === 0 ? (
        <p>No activities recorded yet.</p>
    ) : (
        <div className="activity-timeline">

            {activities.map((activity) => (

                <div className="activity-item" key={activity._id}>

                    <div className="activity-icon">
    {activity.action === "STATUS_UPDATED" && "🔄"}
    {activity.action === "ARTIFACT_ADDED" && "📎"}
    {activity.action === "ARTIFACT_DELETED" && "🗑️"}
    {activity.action === "NOTES_UPDATED" && "📝"}
    {activity.action === "INVESTIGATION_CREATED" && "🔍"}
    {activity.action === "IOCS_TRANSFERRED" && "📥"}
</div>

                    <div className="activity-content">

                        <h4>
                            {activity.action.replaceAll("_", " ")}
                        </h4>

                        <p>{activity.description}</p>

                        <small>
                            {new Date(activity.createdAt).toLocaleString()}
                        </small>

                    </div>

                </div>

            ))}

        </div>
    )}

</div>



        {/* Artifacts and Evidence */}
        <section className="dashboard-section">

          <h2>Artifacts & Evidence</h2>

          <p>
            Collect and manage indicators related to this security incident.
          </p>

          {/* Add Artifact Form */}
          <div className="new-investigation-card no-print">

            <h3>Add New Artifact</h3>

            <form onSubmit={addArtifact}>

              <div className="form-group">
                <label>Artifact Type</label>

                <select
                  value={artifactType}
                  onChange={(e) => setArtifactType(e.target.value)}
                  required
                >
                  <option value="URL">URL</option>
                  <option value="IP Address">IP Address</option>
                  <option value="Domain">Domain</option>
                  <option value="Email">Email</option>
                  <option value="File">File</option>
                  <option value="Hash">Hash</option>
                  <option value="Log">Log</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Artifact Name</label>

                <input
                  type="text"
                  placeholder="Example: Suspicious Banking URL"
                  value={artifactName}
                  onChange={(e) => setArtifactName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Artifact Value</label>

                <textarea
                  placeholder="Enter URL, IP address, domain, hash, etc."
                  value={artifactValue}
                  onChange={(e) => setArtifactValue(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>

                <textarea
                  placeholder="Explain why this artifact is suspicious..."
                  value={artifactDescription}
                  onChange={(e) => setArtifactDescription(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="create-case-btn"
                disabled={addingArtifact}
              >
                {addingArtifact ? "Adding..." : "Add Artifact"}
              </button>

            </form>

          </div>

          {/* Artifact List */}
          <div className="new-investigation-card">

            <h3>Collected Evidence ({artifacts.length})</h3>

            {artifactLoading ? (
              <p>Loading artifacts...</p>
            ) : artifacts.length === 0 ? (
              <p>No artifacts collected yet.</p>
            ) : (

              <div className="artifact-list">

                {artifacts.map((artifact) => (

                  <div
                    key={artifact._id}
                    className="artifact-card"
                    style={{
                      border: "1px solid #ddd",
                      padding: "16px",
                      borderRadius: "8px",
                      marginBottom: "12px"
                    }}
                  >

                    <div>
                      <h3>{artifact.name}</h3>

                      <p>
                        <strong>Type:</strong> {artifact.type}
                      </p>

                      <p>
                        <strong>Value:</strong>
                      </p>

                      <p style={{ wordBreak: "break-word" }}>
                        {artifact.value}
                      </p>

                      <button
    type="button"
    onClick={() => copyArtifactValue(artifact.value)}
    style={{
        marginTop: "8px",
        marginRight: "8px",
        backgroundColor: "#2563eb",
        color: "white",
        border: "none",
        padding: "8px 14px",
        borderRadius: "5px",
        cursor: "pointer"
    }}
>
    Copy Value
</button>

                      {artifact.description && (
                        <p>
                          <strong>Description:</strong> {artifact.description}
                        </p>
                      )}

                      <p>
                        <strong>Source:</strong> {artifact.source}
                      </p>

                      <p>
                        <strong>Added:</strong> {formatDate(artifact.createdAt)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteArtifact(artifact._id)}
                      style={{
                        marginTop: "10px",
                        backgroundColor: "#dc2626",
                        color: "white",
                        border: "none",
                        padding: "8px 14px",
                        borderRadius: "5px",
                        cursor: "pointer"
                      }}
                    >
                      Delete Artifact
                    </button>

                  </div>

                ))}

              </div>

            )}

          </div>

        </section>

        

        <footer className="dashboard-footer">
          PhishLens Security Platform © 2026
        </footer>

      </main>

    </div>
  );
}
