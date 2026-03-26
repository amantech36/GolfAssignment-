import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { supabase } from "../api/supabase"
import { useAuth } from "../context/AuthContext"

export default function CharityDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [charity, setCharity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState(false)
  const [msg, setMsg] = useState("")

  useEffect(() => {
    supabase
      .from("charities")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setCharity(data)
        setLoading(false)
      })
  }, [id])

  const handleSelectCharity = async () => {
    if (!user) return navigate("/login")
    setSelecting(true)
    const { error } = await supabase
      .from("profiles")
      .update({ charity_id: id })
      .eq("id", user.id)

    if (error) {
      setMsg("Failed to update charity. Please try again.")
    } else {
      setMsg("✅ This is now your selected charity!")
    }
    setSelecting(false)
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <span className="loading-text">Loading charity...</span>
      </div>
    )
  }

  if (!charity) {
    return (
      <div className="charity-detail">
        <div className="empty-state" style={{ paddingTop: 120 }}>
          <div className="empty-state-icon"></div>
          <h3>Charity not found</h3>
          <Link to="/charities" className="btn btn-secondary mt-md">← Back to Charities</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="charity-detail">
      <div className="charity-detail-header">
        <Link to="/charities" className="pricing-back-link" style={{ marginBottom: 20, display: "inline-block" }}>← Back to Charities</Link>

        {charity.image_url ? (
          <img src={charity.image_url} alt={charity.name} className="charity-detail-img" />
        ) : (
          <div className="charity-detail-img flex-center" style={{ fontSize: 80, color: "var(--text-muted)" }}></div>
        )}

        {charity.is_featured && <span className="charity-featured-badge mb-2"> Featured Charity</span>}
        <h1>{charity.name}</h1>
        <p>{charity.description || "This charity is dedicated to making a positive impact in communities through golf and beyond."}</p>

        {msg && (
          <div className={`pricing-notice mt-md ${msg.includes("") ? "pricing-notice--success" : "pricing-notice--error"}`}>
            {msg}
          </div>
        )}

        <div className="charity-actions">
          <button className="btn btn-primary" onClick={handleSelectCharity} disabled={selecting}>
            {selecting ? "Selecting..." : " Select as My Charity"}
          </button>
          <Link to="/pricing" className="btn btn-secondary">Subscribe to Support</Link>
        </div>
      </div>

      <footer className="footer">
        © {new Date().getFullYear()} Golf Charity Club
      </footer>
    </div>
  )
}
