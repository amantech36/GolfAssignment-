import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../api/supabase"

export default function CharitiesPage() {
  const [charities, setCharities] = useState([])
  const [search, setSearch] = useState("")
  const [featuredOnly, setFeaturedOnly] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      let query = supabase.from("charities").select("*").order("name")
      if (featuredOnly) query = query.eq("is_featured", true)
      const { data } = await query
      setCharities(data || [])
      setLoading(false)
    }
    load()
  }, [featuredOnly])

  const filtered = charities.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="charities-page">
      <section className="section section-center">
        <div className="section-label">Our Charities</div>
        <h2 className="section-title">Make a Difference</h2>
        <p className="section-subtitle">
          Choose from a curated list of charitable organizations. A portion of your subscription goes directly to them.
        </p>

        <div className="charities-search">
          <input
            type="text"
            className="field-input"
            placeholder="Search charities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className={`charity-filter-btn ${featuredOnly ? "active" : ""}`}
            onClick={() => setFeaturedOnly(!featuredOnly)}
          >
             Featured Only
          </button>
        </div>

        {loading ? (
          <div className="loading-screen" style={{ minHeight: 200 }}>
            <div className="loading-spinner" />
            <span className="loading-text">Loading charities...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"></div>
            <h3>No charities found</h3>
            <p>{search ? "Try a different search term." : "Charities will appear here once added."}</p>
          </div>
        ) : (
          <div className="charity-grid">
            {filtered.map((charity) => (
              <Link
                to={`/charities/${charity.id}`}
                key={charity.id}
                className="charity-card"
                style={{ textDecoration: "none" }}
              >
                {charity.image_url ? (
                  <img src={charity.image_url} alt={charity.name} className="charity-card-img" />
                ) : (
                  <div className="charity-card-img flex-center" style={{ fontSize: 48, color: "var(--text-muted)" }}></div>
                )}
                <div className="charity-card-body">
                  {charity.is_featured && <span className="charity-featured-badge"> Featured</span>}
                  <h3>{charity.name}</h3>
                  <p>{charity.description || "Supporting meaningful causes through the power of golf."}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="footer">
        © {new Date().getFullYear()} Golf Charity Club. Play more, give more.
      </footer>
    </div>
  )
}
