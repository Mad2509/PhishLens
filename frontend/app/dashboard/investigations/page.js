
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Investigations() {

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search and filter states
const [searchTerm, setSearchTerm] = useState("");
const [statusFilter, setStatusFilter] = useState("All");
const [severityFilter, setSeverityFilter] = useState("All");
const [sortBy, setSortBy] = useState("newest");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [deletingId, setDeletingId] = useState(null);

  const fetchIncidents = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
           `${process.env.NEXT_PUBLIC_API_URL}/api/incidents`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        setIncidents(data.incidents);
      } else {
        setError(data.message || "Unable to fetch incidents.");
      }

    } catch (err) {
      setError("Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const createIncident = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/incidents`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            title,
            description,
            severity
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage("Investigation created successfully!");

        setTitle("");
        setDescription("");
        setSeverity("");

        fetchIncidents();
      } else {
        setError(data.message || "Unable to create incident.");
      }

    } catch (err) {
      setError("Server connection failed.");
    }
  };

  // Delete an investigation
const deleteIncident = async (incidentId) => {

    const confirmDelete = window.confirm(
        "Are you sure you want to delete this investigation? This action cannot be undone."
    );

    if (!confirmDelete) {
        return;
    }

    setError("");
    setMessage("");
    setDeletingId(incidentId);

    try {
        const token = localStorage.getItem("token");

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/incidents/${incidentId}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (response.ok && data.success) {

            setIncidents((previousIncidents) =>
                previousIncidents.filter(
                    (incident) => incident._id !== incidentId
                )
            );

            setMessage("Investigation deleted successfully!");

        } else {
            setError(data.message || "Unable to delete investigation.");
        }

    } catch (err) {
        setError("Server connection failed.");
    } finally {
        setDeletingId(null);
    }
};

  const openCount = incidents.filter(
    (incident) => incident.status === "Open"
  ).length;

  const resolvedCount = incidents.filter(
    (incident) => incident.status === "Resolved"
  ).length;

  const criticalCount = incidents.filter(
    (incident) => incident.severity === "Critical"
  ).length;

  // Filter investigations
const filteredIncidents = incidents.filter((incident) => {

    const matchesSearch = incident.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
        statusFilter === "All" ||
        incident.status === statusFilter;

    const matchesSeverity =
        severityFilter === "All" ||
        incident.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;

});


// Sort investigations
const sortedIncidents = [...filteredIncidents].sort((a, b) => {

    if (sortBy === "newest") {
        return new Date(b.createdAt) - new Date(a.createdAt);
    }

    if (sortBy === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
    }

    const severityOrder = {
        Critical: 4,
        High: 3,
        Medium: 2,
        Low: 1
    };

    if (sortBy === "highest") {
        return severityOrder[b.severity] - severityOrder[a.severity];
    }

    if (sortBy === "lowest") {
        return severityOrder[a.severity] - severityOrder[b.severity];
    }

    return 0;
});


  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN");
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

        <header className="investigation-header">
          <div>
            <h1>Investigations</h1>
            <p>Manage and track your phishing security incidents.</p>
          </div>

          <a href="#new-investigation" className="new-investigation-btn">
            + New Investigation
          </a>
        </header>

        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        <section className="stats-grid">

          <div className="stat-card">
            <p>Total Investigations</p>
            <h2>{incidents.length}</h2>
            <span>All recorded incidents</span>
          </div>

          <div className="stat-card warning">
            <p>Open Investigations</p>
            <h2>{openCount}</h2>
            <span>Require analyst attention</span>
          </div>

          <div className="stat-card safe">
            <p>Resolved</p>
            <h2>{resolvedCount}</h2>
            <span>Completed investigations</span>
          </div>

          <div className="stat-card danger">
            <p>Critical Incidents</p>
            <h2>{criticalCount}</h2>
            <span>High-priority threats</span>
          </div>

        </section>

        <section className="dashboard-section">

    <h2>Investigation Records</h2>

    {/* Search and Filters */}
    <div className="investigation-filters">

        <input
            type="text"
            placeholder="Search investigations by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
        >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Investigating">Investigating</option>
            <option value="Pending">Pending</option>
            <option value="Escalated">Escalated</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
        </select>

        <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
        >
            <option value="All">All Severities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
        </select>


<select
    value={sortBy}
    onChange={(e) => setSortBy(e.target.value)}
>
    <option value="newest">Newest First</option>
    <option value="oldest">Oldest First</option>
    <option value="highest">Highest Severity</option>
    <option value="lowest">Lowest Severity</option>
</select>


        <button
            type="button"
            className="clear-btn"
            onClick={() => {
                setSearchTerm("");
                setStatusFilter("All");
                setSeverityFilter("All");
            }}
        >
            Clear Filters
        </button>

    </div>

    <div className="investigation-table">

            <div className="investigation-row table-heading">
              <span>Incident ID</span>
              <span>Investigation</span>
              <span>Severity</span>
              <span>Status</span>
              <span>Date</span>
              <span>Action</span>
            </div>

            {loading ? (
              <p>Loading investigations...</p>
           ) : incidents.length === 0 ? (
    <p>No investigations found. Create your first incident below.</p>
) : filteredIncidents.length === 0 ? (
    <p>No investigations match your search or filters.</p>
) : (
    sortedIncidents.map((incident) => (

                <div className="investigation-row" key={incident._id}>

                  <span>#{incident._id.slice(-6).toUpperCase()}</span>

                  <span>{incident.title}</span>

                  <span className={`severity-${incident.severity.toLowerCase()}`}>
                    {incident.severity}
                  </span>

                  <span className={`status-${incident.status.toLowerCase()}`}>
                    {incident.status}
                  </span>

                  <span>{formatDate(incident.createdAt)}</span>

                  <span className="investigation-actions">

    <Link href={`/dashboard/investigations/${incident._id}`}>
        View
    </Link>

    <button
        type="button"
        className="delete-investigation-btn"
        onClick={() => deleteIncident(incident._id)}
        disabled={deletingId === incident._id}
    >
        {deletingId === incident._id ? "Deleting..." : "Delete"}
    </button>

</span>

                </div>

              ))
            )}

          </div>

        </section>

        
<section
    className="dashboard-section investigation-form-section"
    id="new-investigation"
>

    <div className="form-heading">
        <div className="form-heading-icon">🔍</div>

        <div>
            <h2>Create New Investigation</h2>
            <p>Record and track a new cybersecurity incident.</p>
        </div>

        <span className="form-badge">NEW CASE</span>
    </div>

    <div className="new-investigation-card">

        <form onSubmit={createIncident}>

            <div className="investigation-form-grid">

                {/* Investigation Title */}
                <div className="form-group">
                    <label>Investigation Title</label>

                    <input
                        type="text"
                        placeholder="e.g. Suspicious Banking Website"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>

                {/* Incident Severity */}
                <div className="form-group">
                    <label>Incident Severity</label>

                    <select
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value)}
                        required
                    >
                        <option value="">Select incident severity</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                    </select>
                </div>

            </div>

            {/* Incident Description */}
            <div className="form-group description-group">
                <label>Incident Description</label>

                <textarea
                    rows="5"
                    placeholder="Describe the suspicious activity..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                />
            </div>

            {/* Form Actions */}
            <div className="form-actions">

                <button
                    type="reset"
                    className="clear-btn"
                    onClick={() => {
                        setTitle("");
                        setDescription("");
                        setSeverity("");
                    }}
                >
                    Clear Form
                </button>

                <button type="submit" className="create-case-btn">
                    + Create Investigation
                </button>

            </div>

        </form>

    </div>

</section>


        <footer className="dashboard-footer">
          PhishLens Security Platform © 2026
        </footer>

      </main>
    </div>
  );
}
