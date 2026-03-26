import { useState, useEffect } from "react"
import { supabase } from "../api/supabase"

export default function AdminWinners() {
  const [winners, setWinners] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState("")

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data } = await supabase
      .from("winners")
      .select("*, profiles(email), draws(draw_date)")
      .order("id", { ascending: false })
    setWinners(data || [])
    setLoading(false)
  }

  const handleVerify = async (id, status) => {
    const { error } = await supabase
      .from("winners")
      .update({ verification_status: status })
      .eq("id", id)

    if (error) {
      setMsg(" " + error.message)
    } else {
      setMsg(` Winner ${status}!`)
      load()
    }
  }

  if (loading) return <div className="loading-text">Loading winners...</div>

  return (
    <div>
      <h1>🏆 Winners Management</h1>

      {msg && (
        <div className={`pricing-notice ${msg.includes("") ? "pricing-notice--success" : "pricing-notice--error"}`} style={{ maxWidth: "100%", marginBottom: 20 }}>
          {msg}
        </div>
      )}

      {winners.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"></div>
          <h3>No winners yet</h3>
          <p>Winners will appear here after draws are published.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Draw Date</th>
                <th>Match</th>
                <th>Prize</th>
                <th>Status</th>
                <th>Proof</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {winners.map((w) => (
                <tr key={w.id}>
                  <td>{w.profiles?.email || "—"}</td>
                  <td>
                    {w.draws?.draw_date
                      ? new Date(w.draws.draw_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                      : "—"}
                  </td>
                  <td style={{ fontWeight: 700, color: "var(--accent-light)" }}>{w.match_type}</td>
                  <td>${Number(w.prize_amount || 0).toFixed(2)}</td>
                  <td>
                    <span className={`status-badge ${
                      w.verification_status === "approved" ? "status-active"
                      : w.verification_status === "rejected" ? "status-inactive"
                      : "status-pending"
                    }`}>
                      {w.verification_status}
                    </span>
                  </td>
                  <td>
                    {w.proof_image ? (
                      <a href={w.proof_image} target="_blank" rel="noreferrer" className="text-accent text-sm">
                        View Proof
                      </a>
                    ) : (
                      <span className="text-muted text-sm">None</span>
                    )}
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      {w.verification_status === "pending" && (
                        <>
                          <button
                            onClick={() => handleVerify(w.id, "approved")}
                            style={{ borderColor: "rgba(34,197,94,0.3)", color: "#86efac" }}
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleVerify(w.id, "rejected")}
                            style={{ borderColor: "rgba(239,68,68,0.3)", color: "#fca5a5" }}
                          >
                            ✗ Reject
                          </button>
                        </>
                      )}
                      {w.verification_status === "approved" && (
                        <button
                          onClick={() => handleVerify(w.id, "paid")}
                          style={{ borderColor: "rgba(34,197,94,0.3)", color: "#86efac" }}
                        >
                           Mark Paid
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
