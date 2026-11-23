
import "./globals.css";

export default function Home() {
  return (
    <main>
      <nav className="navbar">
        <h2 className="logo">PhishLens<span>.</span></h2>

        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#about">About</a>
          <a href="/login" className="login-btn">Login</a>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <p className="tagline">CYBERSECURITY • THREAT INTELLIGENCE</p>

          <h1>
            Detect Phishing.
            <br />
            <span>Stay Protected.</span>
          </h1>

          <p className="description">
            Analyze suspicious URLs and email content,
            identify phishing indicators, and investigate
            potential cyber threats with PhishLens.
          </p>

          <div className="hero-buttons">
            <a href="/login" className="primary-btn">
              Get Started →
            </a>
            <a href="#features" className="secondary-btn">
              Explore Features
            </a>
          </div>
        </div>

        <div className="hero-card">
          <div className="card-header">
            <span>THREAT ANALYSIS</span>
            <span className="status">● SYSTEM ACTIVE</span>
          </div>

          <div className="shield">🛡️</div>

          <h2>PhishLens Security</h2>
          <p>Intelligent phishing investigation platform</p>

          <div className="stat-row">
            <div>
              <h3>URL</h3>
              <p>Analysis</p>
            </div>
            <div>
              <h3>EMAIL</h3>
              <p>Scanning</p>
            </div>
            <div>
              <h3>RISK</h3>
              <p>Detection</p>
            </div>
          </div>
        </div>
      </section>

      <section className="features" id="features">
        <p className="tagline">WHAT PHISHLENS OFFERS</p>
        <h2>Security Analysis Made Simple</h2>

        <div className="feature-grid">
          <div className="feature-box">
            <h3>🔗 URL Analysis</h3>
            <p>Identify suspicious links and detect phishing indicators.</p>
          </div>

          <div className="feature-box">
            <h3>📧 Email Analysis</h3>
            <p>Examine email content and identify suspicious patterns.</p>
          </div>

          <div className="feature-box">
            <h3>📊 Risk Detection</h3>
            <p>Understand potential threats through explainable risk scores.</p>
          </div>

          <div className="feature-box">
            <h3>🔍 Investigation</h3>
            <p>Maintain analysis history and investigate security incidents.</p>
          </div>
        </div>
      </section>

      <footer id="about">
        <p>© 2026 PhishLens | Phishing Detection & Investigation Platform</p>
      </footer>
    </main>
  );
}
