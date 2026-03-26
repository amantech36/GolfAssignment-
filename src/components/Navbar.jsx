import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function Navbar() {
  const { user } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const isActive = (path) => location.pathname === path ? "active" : ""

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="navbar-logo-icon">⛳</span>
          Golf Charity Club
        </Link>

        <button className="navbar-hamburger" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? "✕" : "☰"}
        </button>

        <ul className={`navbar-links ${open ? "open" : ""}`} onClick={() => setOpen(false)}>
          <li><Link to="/" className={isActive("/")}>Home</Link></li>
          <li><Link to="/charities" className={isActive("/charities")}>Charities</Link></li>
          <li><Link to="/draws" className={isActive("/draws")}>Draws</Link></li>
          <li><Link to="/pricing" className={isActive("/pricing")}>Pricing</Link></li>
          {user ? (
            <>
              <li><Link to="/dashboard" className={isActive("/dashboard")}>Dashboard</Link></li>
              <li><Link to="/dashboard" className="navbar-cta">My Account</Link></li>
            </>
          ) : (
            <>
              <li><Link to="/login" className={isActive("/login")}>Log In</Link></li>
              <li><Link to="/signup" className="navbar-cta">Get Started</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  )
}
