import { useState, useEffect } from "react"
import { supabase } from "../api/supabase"
import {
  generateRandomNumbers,
  generateAlgorithmicNumbers,
  countMatches,
  getMatchType,
  calculatePrizePool,
} from "../utils/drawEngine"

export default function AdminDraws() {
  const [draws, setDraws] = useState([])
  const [loading, setLoading] = useState(true)
  const [drawMode, setDrawMode] = useState("random") // random | algorithmic
  const [simNumbers, setSimNumbers] = useState([])
  const [simResults, setSimResults] = useState(null)
  const [publishing, setPublishing] = useState(false)
  const [msg, setMsg] = useState("")

  useEffect(() => {
    loadDraws()
  }, [])

  const loadDraws = async () => {
    const { data } = await supabase
      .from("draws")
      .select("*")
      .order("draw_date", { ascending: false })
    setDraws(data || [])
    setLoading(false)
  }

  // Run simulation
  const handleSimulate = async () => {
    setMsg("")
    let numbers

    if (drawMode === "algorithmic") {
      // Fetch all scores for algorithmic weighting
      const { data: allScores } = await supabase.from("scores").select("score")
      const scoreValues = (allScores || []).map((s) => s.score)
      numbers = generateAlgorithmicNumbers(scoreValues, "frequent")
    } else {
      numbers = generateRandomNumbers()
    }

    setSimNumbers(numbers)

    // Simulate matches against all users' scores
    const { data: allUsers } = await supabase.from("profiles").select("id").eq("subscription_status", "active")
    const userIds = (allUsers || []).map((u) => u.id)

    let matches = { 5: 0, 4: 0, 3: 0 }
    let matchedUsers = []

    for (const uid of userIds) {
      const { data: userScores } = await supabase
        .from("scores")
        .select("score")
        .eq("user_id", uid)
        .order("score_date", { ascending: false })
        .limit(5)

      if (!userScores || userScores.length === 0) continue
      const scores = userScores.map((s) => s.score)
      const count = countMatches(scores, numbers)
      const type = getMatchType(count)

      if (type) {
        matches[count] = (matches[count] || 0) + 1
        matchedUsers.push({ userId: uid, matchCount: count, type })
      }
    }

    const pool = calculatePrizePool(userIds.length)
    setSimResults({ matches, matchedUsers, pool, subscriberCount: userIds.length })
  }

  // Publish draw
  const handlePublish = async () => {
    if (simNumbers.length === 0) {
      setMsg("Run a simulation first!")
      return
    }

    setPublishing(true)
    const drawDate = new Date().toISOString().split("T")[0]

    // Insert draw
    const { data: newDraw, error: drawErr } = await supabase
      .from("draws")
      .insert([{
        draw_date: drawDate,
        winning_numbers: JSON.stringify(simNumbers),
        status: "published",
      }])
      .select()
      .single()

    if (drawErr) {
      setMsg(" Failed to create draw: " + drawErr.message)
      setPublishing(false)
      return
    }

    // Insert winners
    if (simResults?.matchedUsers) {
      const pool = simResults.pool
      for (const mu of simResults.matchedUsers) {
        const prizeMap = { 5: pool.fiveMatch, 4: pool.fourMatch, 3: pool.threeMatch }
        const winnersInTier = simResults.matchedUsers.filter((u) => u.matchCount === mu.matchCount).length
        const prizeAmount = (prizeMap[mu.matchCount] || 0) / winnersInTier

        await supabase.from("winners").insert([{
          user_id: mu.userId,
          draw_id: newDraw.id,
          match_type: mu.type,
          prize_amount: prizeAmount,
          verification_status: "pending",
        }])
      }
    }

    setMsg("Draw published and winners recorded!")
    setSimNumbers([])
    setSimResults(null)
    setPublishing(false)
    loadDraws()
  }

  const parseNumbers = (str) => {
    try { return JSON.parse(str) } catch { return (str || "").split(",").map(Number).filter(Boolean) }
  }

  if (loading) return <div className="loading-text">Loading draws...</div>

  return (
    <div>
      <h1> Draw Management</h1>

      {/* Simulation Box */}
      <div className="simulation-box">
        <h3> Draw Simulation</h3>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 20, flexWrap: "wrap" }}>
          <button
            className={`charity-filter-btn ${drawMode === "random" ? "active" : ""}`}
            onClick={() => setDrawMode("random")}
          >
             Random
          </button>
          <button
            className={`charity-filter-btn ${drawMode === "algorithmic" ? "active" : ""}`}
            onClick={() => setDrawMode("algorithmic")}
          >
            🧮 Algorithmic
          </button>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn btn-secondary btn-sm" onClick={handleSimulate}>
            Run Simulation
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handlePublish}
            disabled={publishing || simNumbers.length === 0}
          >
            {publishing ? "Publishing..." : " Publish Draw"}
          </button>
        </div>

        {simNumbers.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <p className="text-muted text-sm" style={{ marginBottom: 12 }}>Simulated Winning Numbers:</p>
            <div className="draw-numbers">
              {simNumbers.map((n, i) => (
                <div key={i} className="draw-ball">{n}</div>
              ))}
            </div>
          </div>
        )}

        {simResults && (
          <div style={{ marginTop: 20, textAlign: "left" }}>
            <p className="text-sm" style={{ color: "var(--text-secondary)", marginBottom: 8 }}>
              <strong>Active Subscribers:</strong> {simResults.subscriberCount}
            </p>
            <p className="text-sm" style={{ color: "var(--text-secondary)", marginBottom: 4 }}>
              <strong>5-Match Winners:</strong> {simResults.matches[5] || 0}
            </p>
            <p className="text-sm" style={{ color: "var(--text-secondary)", marginBottom: 4 }}>
              <strong>4-Match Winners:</strong> {simResults.matches[4] || 0}
            </p>
            <p className="text-sm" style={{ color: "var(--text-secondary)", marginBottom: 4 }}>
              <strong>3-Match Winners:</strong> {simResults.matches[3] || 0}
            </p>
            <p className="text-sm" style={{ color: "var(--accent-light)", marginTop: 8 }}>
              <strong>Total Prize Pool:</strong> ${simResults.pool.total}
            </p>
          </div>
        )}

        {msg && (
          <div className={`pricing-notice mt-md ${msg.includes("") ? "pricing-notice--success" : "pricing-notice--error"}`} style={{ maxWidth: "100%" }}>
            {msg}
          </div>
        )}
      </div>

      {/* Past Draws */}
      <h2 style={{ fontSize: 18, marginBottom: 16 }}>All Draws</h2>
      {draws.length === 0 ? (
        <div className="empty-state"><p>No draws yet. Run your first simulation above!</p></div>
      ) : (
        <div className="draw-history">
          {draws.map((d) => (
            <div key={d.id} className="draw-history-item">
              <div>
                <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                  {new Date(d.draw_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </div>
                <span className={`status-badge ${d.status === "published" ? "status-active" : "status-pending"}`}>
                  {d.status}
                </span>
              </div>
              <div className="draw-history-numbers">
                {parseNumbers(d.winning_numbers).map((n, i) => (
                  <div key={i} className="draw-ball-sm">{n}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
