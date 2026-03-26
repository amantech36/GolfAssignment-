import { useState, useEffect } from "react"
import { supabase } from "../api/supabase"

export default function AdminReports() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscribers: 0,
    totalCharities: 0,
    totalDraws: 0,
    totalWinners: 0,
    totalPrizesPaid: 0,
    totalCharityContributions: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      // Total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })

      // Active subscribers
      const { count: activeSubscribers } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("subscription_status", "active")

      // Total charities
      const { count: totalCharities } = await supabase
        .from("charities")
        .select("id", { count: "exact", head: true })

      // Total draws
      const { count: totalDraws } = await supabase
        .from("draws")
        .select("id", { count: "exact", head: true })
        .eq("status", "published")

      // Winners & prizes
      const { data: winnersData } = await supabase
        .from("winners")
        .select("prize_amount, verification_status")

      const totalWinners = winnersData?.length || 0
      const totalPrizesPaid = (winnersData || [])
        .filter((w) => w.verification_status === "paid" || w.verification_status === "approved")
        .reduce((sum, w) => sum + (Number(w.prize_amount) || 0), 0)

      // Charity contributions estimate (activeSubscribers * $20 * avg 10%)
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("charity_percentage")
        .eq("subscription_status", "active")

      const avgPercent = profilesData?.length
        ? profilesData.reduce((s, p) => s + (p.charity_percentage || 10), 0) / profilesData.length
        : 10
      const totalCharityContributions = Math.round((activeSubscribers || 0) * 20 * (avgPercent / 100) * 100) / 100

      setStats({
        totalUsers: totalUsers || 0,
        activeSubscribers: activeSubscribers || 0,
        totalCharities: totalCharities || 0,
        totalDraws: totalDraws || 0,
        totalWinners,
        totalPrizesPaid: Math.round(totalPrizesPaid * 100) / 100,
        totalCharityContributions,
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="loading-text">Loading reports...</div>

  return (
    <div>
      <h1> Reports & Analytics</h1>

      <div className="admin-stats">
        <div className="admin-stat">
          <div className="admin-stat-label">Total Users</div>
          <div className="admin-stat-value">{stats.totalUsers}</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-label">Active Subscribers</div>
          <div className="admin-stat-value" style={{ color: "var(--success)" }}>{stats.activeSubscribers}</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-label">Charities</div>
          <div className="admin-stat-value">{stats.totalCharities}</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-label">Draws Published</div>
          <div className="admin-stat-value">{stats.totalDraws}</div>
        </div>
      </div>

      <div className="admin-stats">
        <div className="admin-stat">
          <div className="admin-stat-label">Total Winners</div>
          <div className="admin-stat-value">{stats.totalWinners}</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-label">Prizes Paid Out</div>
          <div className="admin-stat-value" style={{ color: "var(--accent-light)" }}>${stats.totalPrizesPaid.toFixed(2)}</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-label">Monthly Charity Contributions</div>
          <div className="admin-stat-value" style={{ color: "var(--success)" }}>${stats.totalCharityContributions.toFixed(2)}</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-label">Est. Monthly Prize Pool</div>
          <div className="admin-stat-value" style={{ color: "var(--warning)" }}>
            ${(stats.activeSubscribers * 20 * 0.5).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="dash-card" style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>Platform Summary</h3>
        <div className="info-row">
          <span className="info-label">Revenue (est./month)</span>
          <span className="info-value">${(stats.activeSubscribers * 20).toFixed(2)}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Charity Pool %</span>
          <span className="info-value">{stats.activeSubscribers > 0 ? Math.round(stats.totalCharityContributions / (stats.activeSubscribers * 20) * 100) : 10}%</span>
        </div>
        <div className="info-row">
          <span className="info-label">Prize Pool %</span>
          <span className="info-value">50%</span>
        </div>
        <div className="info-row">
          <span className="info-label">Win Rate</span>
          <span className="info-value">
            {stats.totalUsers > 0 ? ((stats.totalWinners / stats.totalUsers) * 100).toFixed(1) : 0}%
          </span>
        </div>
      </div>
    </div>
  )
}
