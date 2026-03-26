import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../api/supabase"

export default function HomePage() {
  const [featuredCharities, setFeaturedCharities] = useState([])

  useEffect(() => {
    supabase
      .from("charities")
      .select("*")
      .eq("is_featured", true)
      .limit(3)
      .then(({ data }) => setFeaturedCharities(data || []))
  }, [])

  return (
    <div className="home-page">
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">🏆 Play · Win · Give Back</div>
          <h1>
            Golf Meets <span className="gradient-text">Charity.</span><br />
            Every Score <span className="gradient-text">Counts.</span>
          </h1>
          <p>
            Subscribe, enter your golf scores, and compete in monthly prize draws
            — all while supporting the charities you care about most.
          </p>
          <div className="hero-buttons">
            <Link to="/signup" className="btn btn-primary">Start Your Journey →</Link>
            <Link to="/charities" className="btn btn-secondary">Explore Charities</Link>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-value">$10K+</div>
          <div className="stat-label">Prize Pool</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">500+</div>
          <div className="stat-label">Players</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">$25K+</div>
          <div className="stat-label">Donated</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">12</div>
          <div className="stat-label">Charities</div>
        </div>
      </div>

      {/* ── How It Works ── */}
      <section className="section section-center">
        <div className="section-label">How It Works</div>
        <h2 className="section-title">Three Simple Steps</h2>
        <p className="section-subtitle">
          Join thousands of golfers making a difference while competing for monthly prizes.
        </p>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Subscribe & Choose</h3>
            <p>Pick a monthly or yearly plan and select the charity you want to support with your subscription.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Enter Your Scores</h3>
            <p>Submit your latest Stableford scores. We keep your best 5 — the numbers that enter the draw.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Win & Give Back</h3>
            <p>Each month, winning numbers are drawn. Match 3, 4, or 5 to win prizes. Your charity benefits too!</p>
          </div>
        </div>
      </section>

      {/* ── Featured Charities ── */}
      {featuredCharities.length > 0 && (
        <section className="section section-center">
          <div className="section-label">Featured Charities</div>
          <h2 className="section-title">Impact That Matters</h2>
          <p className="section-subtitle">
            A portion of every subscription goes directly to charities chosen by our community.
          </p>
          <div className="charity-grid">
            {featuredCharities.map((charity) => (
              <Link to={`/charities/${charity.id}`} key={charity.id} className="charity-card" style={{ textDecoration: "none" }}>
                {charity.image_url ? (
                  <img src={charity.image_url} alt={charity.name} className="charity-card-img" />
                ) : (
                  <div className="charity-card-img" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, color: "var(--text-muted)" }}>💚</div>
                )}
                <div className="charity-card-body">
                  <span className="charity-featured-badge">Featured</span>
                  <h3>{charity.name}</h3>
                  <p>{charity.description || "Supporting meaningful causes through golf."}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-lg">
            <Link to="/charities" className="btn btn-secondary">View All Charities →</Link>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="cta-section">
        <h2>Ready to <span className="gradient-text">Play & Give?</span></h2>
        <p>Join the club today. Your first draw is just a subscription away.</p>
        <div className="hero-buttons">
          <Link to="/pricing" className="btn btn-primary">View Plans & Pricing</Link>
          <Link to="/draws" className="btn btn-secondary">See How Draws Work</Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        © {new Date().getFullYear()} Golf Charity Club. Play more, give more, win more.
      </footer>
    </div>
  )
}
