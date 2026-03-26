import { useState, useEffect } from "react"
import { supabase } from "../api/supabase"
import { useAuth } from "../context/AuthContext"
import { calculatePrizePool } from "../utils/drawEngine"

export default function DrawsPage() {
  const { user } = useAuth()
  const [draws, setDraws] = useState([])
  const [loading, setLoading] = useState(true)
  const [subscriberCount, setSubscriberCount] = useState(0)

  useEffect(() => {
    const load = async () => {
      // Fetch published draws
      const { data: drawData } = await supabase
        .from("draws")
        .select("*")
        .eq("status", "published")
        .order("draw_date", { ascending: false })
        .limit(12)

      setDraws(drawData || [])

      // Get active subscriber count for prize pool calc
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("subscription_status", "active")

      setSubscriberCount(count || 0)
      setLoading(false)
    }
    load()
  }, [])

  const pool = calculatePrizePool(Math.max(subscriberCount, 10)) // Min 10 for display
  const latestDraw = draws[0]

  const parseNumbers = (str) => {
    if (!str) return []
    try { return JSON.parse(str) } catch { return str.split(",").map(Number).filter(Boolean) }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <span className="loading-text">Loading draws...</span>
      </div>
    )
  }

  return (
    <div className="draws-page">
      <section className="section section-center">
        <div className="section-label">Monthly Draws</div>
        <h2 className="section-title">Prize Draw Results</h2>
        <p className="section-subtitle">
          Every month, 5 winning numbers are drawn. Match your scores to win from the prize pool!
        </p>

        {/* ── Current/Latest Draw ── */}
        <div className="draw-current">
          <h3 style={{ fontSize: 18, marginBottom: 8, color: "var(--text-primary)" }}>
            {latestDraw ? `Draw — ${new Date(latestDraw.draw_date).toLocaleDateString("en-US", { month: "long", year: "numeric" })}` : "Next Draw Coming Soon"}
          </h3>
          {latestDraw ? (
            <>
              <p className="text-muted text-sm">Winning Numbers</p>
              <div className="draw-numbers">
                {parseNumbers(latestDraw.winning_numbers).map((n, i) => (
                  <div key={i} className="draw-ball">{n}</div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-muted">The next draw will be published at the end of this month. Subscribe and enter your scores!</p>
          )}
        </div>

        {/* ── Prize Pool Breakdown ── */}
        <h3 className="section-title" style={{ fontSize: 24, marginBottom: 8 }}>Prize Pool Distribution</h3>
        <p className="text-muted text-sm" style={{ marginBottom: 24 }}>Based on {subscriberCount} active subscribers</p>

        <div className="prize-breakdown">
          <div className="prize-tier">
            <div className="prize-tier-title">🏆 5-Number Match</div>
            <div className="prize-tier-amount">${pool.fiveMatch}</div>
            <div className="prize-tier-share">40% of pool · Jackpot (rolls over)</div>
          </div>
          <div className="prize-tier">
            <div className="prize-tier-title">🥈 4-Number Match</div>
            <div className="prize-tier-amount">${pool.fourMatch}</div>
            <div className="prize-tier-share">35% of pool</div>
          </div>
          <div className="prize-tier">
            <div className="prize-tier-title">🥉 3-Number Match</div>
            <div className="prize-tier-amount">${pool.threeMatch}</div>
            <div className="prize-tier-share">25% of pool</div>
          </div>
        </div>

        {/* ── Draw History ── */}
        {draws.length > 1 && (
          <>
            <h3 className="section-title" style={{ fontSize: 24, marginTop: 56, marginBottom: 24 }}>Past Draws</h3>
            <div className="draw-history">
              {draws.slice(1).map((draw) => (
                <div key={draw.id} className="draw-history-item">
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                      {new Date(draw.draw_date).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </div>
                    <div className="text-muted text-sm">{draw.status}</div>
                  </div>
                  <div className="draw-history-numbers">
                    {parseNumbers(draw.winning_numbers).map((n, i) => (
                      <div key={i} className="draw-ball-sm">{n}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <footer className="footer">
        © {new Date().getFullYear()} Golf Charity Club
      </footer>
    </div>
  )
}
