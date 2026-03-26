
import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { supabase } from "../api/supabase"

export default function LoginPage() {
  // ---- Form state ----
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")

  // ---- UI state ----
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const navigate = useNavigate()

  // ------------------------------------------------------------------
  // Handle login form submission
  // ------------------------------------------------------------------
  const handleLogin = async () => {
    setError(null)

    // Basic client-side validation
    if (!email || !password) {
      setError("Please enter your email and password.")
      return
    }

    setLoading(true)
    console.log("[LoginPage] Attempting login for:", email)

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError) {
      // Common: "Invalid login credentials" or "Email not confirmed"
      console.error("[LoginPage] Login error:", loginError.message)
      setError(loginError.message)
      setLoading(false)
      return
    }

    // Session is now active — AuthContext will pick this up automatically
    console.log("[LoginPage] Login success. User ID:", data.user?.id)
    setLoading(false)

    // Navigate to dashboard / home
    navigate("/")
  }

  // Allow pressing Enter key to submit the form
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin()
  }

  // ------------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------------
  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <span className="auth-icon">⛳</span>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Log in to your Golf Charity account</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="auth-error" role="alert">
             {error}
          </div>
        )}

        {/* ---- Email Field ---- */}
        <div className="field-group">
          <label htmlFor="login-email" className="field-label">Email</label>
          <input
            id="login-email"
            type="email"
            className="field-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="email"
          />
        </div>

        {/* ---- Password Field ---- */}
        <div className="field-group">
          <label htmlFor="login-password" className="field-label">Password</label>
          <input
            id="login-password"
            type="password"
            className="field-input"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="current-password"
          />
        </div>

        {/* ---- Login Button ---- */}
        <button
          id="login-btn"
          className="auth-btn"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        {/* ---- Link to Signup ---- */}
        <p className="auth-switch">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="auth-link">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
