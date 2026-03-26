// ============================================================
// Dashboard.jsx — Full User Dashboard with all PRD modules
// ============================================================

import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "./context/AuthContext"
import { supabase } from "./api/supabase"

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [scores, setScores] = useState([])
  const [charities, setCharities] = useState([])
  const [winners, setWinners] = useState([])
  const [draws, setDraws] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  // Score form state
  const [newScore, setNewScore] = useState("")
  const [scoreDate, setScoreDate] = useState(new Date().toISOString().split("T")[0])
  const [scoreMsg, setScoreMsg] = useState("")

  // Charity form state
  const [selectedCharity, setSelectedCharity] = useState("")
  const [charityPercent, setCharityPercent] = useState(10)
  const [charityMsg, setCharityMsg] = useState("")

  // Fetch all dashboard data
  useEffect(() => {
    if (!user) return
    const load = async () => {
      // Profile
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
      setProfile(prof)
      if (prof) {
        setSelectedCharity(prof.charity_id || "")
        setCharityPercent(prof.charity_percentage || 10)
      }

      // Scores
      const { data: sc } = await supabase
        .from("scores")
        .select("*")
        .eq("user_id", user.id)
        .order("score_date", { ascending: false })
      setScores(sc || [])

      // Charities list
      const { data: ch } = await supabase
        .from("charities")
        .select("id, name")
        .order("name")
      setCharities(ch || [])

      // Winners (user's wins)
      const { data: w } = await supabase
        .from("winners")
        .select("*, draws(draw_date)")
        .eq("user_id", user.id)
        .order("id", { ascending: false })
      setWinners(w || [])

      // Recent draws
      const { data: d } = await supabase
        .from("draws")
        .select("*")
        .eq("status", "published")
        .order("draw_date", { ascending: false })
        .limit(5)
      setDraws(d || [])

      setLoading(false)
    }
    load()
  }, [user])

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate("/login")
  }

  // Add Score (rolling 5)
  const handleAddScore = async () => {
    setScoreMsg("")
    const val = Number(newScore)
    if (!val || val < 1 || val > 45) {
      setScoreMsg(" Score must be between 1 and 45 (Stableford)")
      return
    }
    if (!scoreDate) {
      setScoreMsg(" Please select a date")
      return
    }

    // If already 5 scores, delete the oldest
    if (scores.length >= 5) {
      const oldest = scores[scores.length - 1] // last in desc order = oldest
      await supabase.from("scores").delete().eq("id", oldest.id)
    }

    const { error } = await supabase.from("scores").insert([
      { user_id: user.id, score: val, score_date: scoreDate }
    ])

    if (error) {
      setScoreMsg(" Failed to add score: " + error.message)
    } else {
      setScoreMsg(" Score added!")
      setNewScore("")
      // Refresh scores
      const { data } = await supabase
        .from("scores")
        .select("*")
        .eq("user_id", user.id)
        .order("score_date", { ascending: false })
      setScores(data || [])
    }
  }

  // Update charity
  const handleUpdateCharity = async () => {
    setCharityMsg("")
    if (charityPercent < 10) {
      setCharityMsg(" Minimum charity contribution is 10%")
      return
    }
    const { error } = await supabase
      .from("profiles")
      .update({ charity_id: selectedCharity, charity_percentage: charityPercent })
      .eq("id", user.id)

    if (error) {
      setCharityMsg(" Failed to update: " + error.message)
    } else {
      setCharityMsg("Charity preference updated!")
      setProfile((p) => ({ ...p, charity_id: selectedCharity, charity_percentage: charityPercent }))
    }
  }

  // Delete score
  const handleDeleteScore = async (id) => {
    await supabase.from("scores").delete().eq("id", id)
    setScores(scores.filter((s) => s.id !== id))
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <span className="loading-text">Loading your dashboard...</span>
      </div>
    )
  }

  const charityName = charities.find((c) => c.id === profile?.charity_id)?.name || "None selected"
  const totalWinnings = winners.reduce((sum, w) => sum + (Number(w.prize_amount) || 0), 0)

  const tabs = [
    { id: "overview", icon: "📊", label: "Overview" },
    { id: "scores", icon: "⛳", label: "My Scores" },
    { id: "charity", icon: "💚", label: "Charity" },
    { id: "draws", icon: "🎱", label: "Draws" },
    { id: "winnings", icon: "🏆", label: "Winnings" },
  ]

  return (
    <div className="dashboard-layout">
      {/* ── Sidebar ── */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-label">Dashboard</div>
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`sidebar-item ${activeTab === t.id ? "active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            <span className="sidebar-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button className="sidebar-item" onClick={handleLogout}>
          <span className="sidebar-icon">🚪</span>
          Log Out
        </button>
      </aside>

      {/* ── Main Content ── */}
      <main className="dashboard-main">
        <div className="dashboard-welcome">
          <h1>Welcome back 👋</h1>
          <p>{profile?.email}</p>
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <>
            {/* Subscription Card */}
            <div className="dash-card">
              <div className="dash-card-header">
                <div className="dash-card-title"><span className="icon">💳</span> Subscription</div>
                <span className={`status-badge ${profile?.subscription_status === "active" ? "status-active" : "status-inactive"}`}>
                  {profile?.subscription_status || "inactive"}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Status</span>
                <span className="info-value">{profile?.subscription_status || "Inactive"}</span>
              </div>
              {profile?.subscription_end_date && (
                <div className="info-row">
                  <span className="info-label">Renewal Date</span>
                  <span className="info-value">{new Date(profile.subscription_end_date).toLocaleDateString()}</span>
                </div>
              )}
              <div className="info-row">
                <span className="info-label">Charity</span>
                <span className="info-value">{charityName}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Contribution</span>
                <span className="info-value">{profile?.charity_percentage || 10}%</span>
              </div>
              {profile?.subscription_status !== "active" && (
                <Link to="/pricing" className="btn btn-primary btn-sm mt-md">Upgrade Now →</Link>
              )}
            </div>

            {/* Quick Scores */}
            <div className="dash-card">
              <div className="dash-card-header">
                <div className="dash-card-title"><span className="icon">⛳</span> Your Scores</div>
                <span className="text-muted text-sm">{scores.length}/5 entered</span>
              </div>
              {scores.length === 0 ? (
                <p className="text-muted">No scores yet. Add your first score!</p>
              ) : (
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {scores.slice(0, 5).map((s) => (
                    <div key={s.id} style={{
                      background: "var(--accent-bg)",
                      border: "1px solid rgba(168,85,247,0.2)",
                      borderRadius: 12,
                      padding: "12px 20px",
                      textAlign: "center",
                      minWidth: 80
                    }}>
                      <div className="score-value">{s.score}</div>
                      <div className="text-muted text-sm">{s.score_date ? new Date(s.score_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</div>
                    </div>
                  ))}
                </div>
              )}
              <button className="btn btn-secondary btn-sm mt-md" onClick={() => setActiveTab("scores")}>
                Manage Scores →
              </button>
            </div>

            {/* Quick Winnings */}
            <div className="dash-card">
              <div className="dash-card-header">
                <div className="dash-card-title"><span className="icon">🏆</span> Total Winnings</div>
              </div>
              <div className="winnings-total">${totalWinnings.toFixed(2)}</div>
              <p className="text-muted text-sm">{winners.length} prizes won</p>
            </div>
          </>
        )}

        {/* ── SCORES TAB ── */}
        {activeTab === "scores" && (
          <div className="dash-card">
            <div className="dash-card-header">
              <div className="dash-card-title"><span className="icon">⛳</span> Score Management</div>
              <span className="text-muted text-sm">{scores.length}/5 scores</span>
            </div>

            {scores.length > 0 && (
              <table className="scores-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Score</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.slice(0, 5).map((s, i) => (
                    <tr key={s.id}>
                      <td>{i + 1}</td>
                      <td><span className="score-value">{s.score}</span></td>
                      <td>{s.score_date ? new Date(s.score_date).toLocaleDateString() : "—"}</td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ padding: "4px 12px", fontSize: 12 }}
                          onClick={() => handleDeleteScore(s.id)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {scoreMsg && (
              <div className={`pricing-notice mt-md ${scoreMsg.includes("✅") ? "pricing-notice--success" : "pricing-notice--error"}`} style={{ maxWidth: "100%" }}>
                {scoreMsg}
              </div>
            )}

            <div className="score-entry">
              <div className="field-group">
                <label className="field-label">Score (1–45)</label>
                <input
                  type="number"
                  className="field-input"
                  min={1}
                  max={45}
                  placeholder="e.g. 36"
                  value={newScore}
                  onChange={(e) => setNewScore(e.target.value)}
                />
              </div>
              <div className="field-group">
                <label className="field-label">Date</label>
                <input
                  type="date"
                  className="field-input"
                  value={scoreDate}
                  onChange={(e) => setScoreDate(e.target.value)}
                />
              </div>
              <button className="btn btn-primary btn-sm" onClick={handleAddScore}>
                Add Score
              </button>
            </div>

            <p className="text-muted text-sm mt-md">
              Only your latest 5 scores are kept. Adding a new score when you have 5 will replace the oldest.
            </p>
          </div>
        )}

        {/* ── CHARITY TAB ── */}
        {activeTab === "charity" && (
          <div className="dash-card">
            <div className="dash-card-header">
              <div className="dash-card-title"><span className="icon">💚</span> Your Charity</div>
            </div>

            <div className="info-row">
              <span className="info-label">Current Charity</span>
              <span className="info-value">{charityName}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Contribution</span>
              <span className="info-value">{profile?.charity_percentage || 10}%</span>
            </div>

            <div style={{ marginTop: 24 }}>
              <div className="field-group" style={{ marginBottom: 16 }}>
                <label className="field-label">Change Charity</label>
                <select
                  className="field-select"
                  value={selectedCharity}
                  onChange={(e) => setSelectedCharity(e.target.value)}
                >
                  <option value="">Select a charity</option>
                  {charities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="field-group" style={{ marginBottom: 16 }}>
                <label className="field-label">
                  Contribution: <span className="pct-badge">{charityPercent}%</span>
                </label>
                <input
                  type="range"
                  className="field-slider"
                  min={10}
                  max={100}
                  step={1}
                  value={charityPercent}
                  onChange={(e) => setCharityPercent(Number(e.target.value))}
                />
                <div className="slider-labels">
                  <span>10%</span>
                  <span>100%</span>
                </div>
              </div>

              {charityMsg && (
                <div className={`pricing-notice ${charityMsg.includes("✅") ? "pricing-notice--success" : "pricing-notice--error"}`} style={{ maxWidth: "100%", marginBottom: 16 }}>
                  {charityMsg}
                </div>
              )}

              <button className="btn btn-primary btn-sm" onClick={handleUpdateCharity}>
                Save Changes
              </button>
            </div>

            <div className="mt-lg">
              <Link to="/charities" className="btn btn-secondary btn-sm">Browse All Charities →</Link>
            </div>
          </div>
        )}

        {/* ── DRAWS TAB ── */}
        {activeTab === "draws" && (
          <div className="dash-card">
            <div className="dash-card-header">
              <div className="dash-card-title"><span className="icon">🎱</span> Draw Participation</div>
            </div>

            {profile?.subscription_status === "active" ? (
              <>
                <div className="info-row">
                  <span className="info-label">Status</span>
                  <span className="status-badge status-active">Entered</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Your Numbers</span>
                  <span className="info-value">
                    {scores.length >= 5
                      ? scores.slice(0, 5).map((s) => s.score).join(", ")
                      : `${scores.length}/5 scores entered`
                    }
                  </span>
                </div>
              </>
            ) : (
              <div className="empty-state" style={{ padding: "24px 0" }}>
                <p>Subscribe to participate in monthly draws!</p>
                <Link to="/pricing" className="btn btn-primary btn-sm mt-md">Subscribe Now</Link>
              </div>
            )}

            {draws.length > 0 && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 24, marginBottom: 16, color: "var(--text-primary)" }}>
                  Recent Results
                </h3>
                <div className="draw-history">
                  {draws.map((d) => {
                    let nums = []
                    try { nums = JSON.parse(d.winning_numbers) } catch { nums = (d.winning_numbers || "").split(",").map(Number).filter(Boolean) }
                    return (
                      <div key={d.id} className="draw-history-item">
                        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                          {new Date(d.draw_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                        </span>
                        <div className="draw-history-numbers">
                          {nums.map((n, i) => (
                            <div key={i} className="draw-ball-sm">{n}</div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            <div className="mt-lg">
              <Link to="/draws" className="btn btn-secondary btn-sm">View All Draws →</Link>
            </div>
          </div>
        )}

        {/* ── WINNINGS TAB ── */}
        {activeTab === "winnings" && (
          <div className="dash-card">
            <div className="dash-card-header">
              <div className="dash-card-title"><span className="icon">🏆</span> Winnings & Payouts</div>
            </div>

            <div className="winnings-total">${totalWinnings.toFixed(2)}</div>
            <p className="text-muted text-sm" style={{ marginBottom: 24 }}>{winners.length} total prizes</p>

            {winners.length === 0 ? (
              <div className="empty-state" style={{ padding: "24px 0" }}>
                <p>No winnings yet. Keep entering your scores — your lucky draw could be next!</p>
              </div>
            ) : (
              <table className="scores-table">
                <thead>
                  <tr>
                    <th>Draw</th>
                    <th>Match</th>
                    <th>Prize</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {winners.map((w) => (
                    <tr key={w.id}>
                      <td>{w.draws?.draw_date ? new Date(w.draws.draw_date).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"}</td>
                      <td>{w.match_type}</td>
                      <td className="score-value">${Number(w.prize_amount).toFixed(2)}</td>
                      <td>
                        <span className={`status-badge ${w.verification_status === "approved" ? "status-paid" : "status-pending"}`}>
                          {w.verification_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Proof Upload */}
            {winners.some((w) => w.verification_status === "pending") && (
              <div className="mt-lg">
                <p className="text-muted text-sm" style={{ marginBottom: 8 }}>
                  Upload a screenshot of your scores for verification:
                </p>
                <input
                  type="file"
                  accept="image/*"
                  className="field-input"
                  style={{ padding: 8 }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const path = `proofs/${user.id}/${Date.now()}_${file.name}`
                    const { error } = await supabase.storage.from("proofs").upload(path, file)
                    if (error) {
                      alert("Upload failed: " + error.message)
                    } else {
                      const pendingWin = winners.find((w) => w.verification_status === "pending")
                      if (pendingWin) {
                        await supabase.from("winners").update({ proof_image: path }).eq("id", pendingWin.id)
                      }
                      alert("✅ Proof uploaded successfully!")
                    }
                  }}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
