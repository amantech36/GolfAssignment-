// ============================================================
// SignupPage.jsx
// PURPOSE: New user registration form.
//
// UI FIELDS:
//   1. Email         → maps to Supabase auth.users.email
//   2. Password      → Supabase auth handles hashing
//   3. Charity       → fetches from `charities` table, stored in profile
//   4. Charity %     → slider, minimum 10% (PRD requirement)
//
// FLOW:
//   1. On mount → fetch charities list from Supabase
//   2. User fills form → clicks Signup
//   3. supabase.auth.signUp() creates the auth user
//   4. A matching row in `profiles` is inserted manually
//      ⚠️ IMPORTANT: Without the profile insert, your app will break
//         whenever you try to fetch charity/subscription data later!
//   5. On success → redirect to /login
//
// DEBUG TIPS:
//   - If charities list is empty → check RLS policy on `charities` table
//     (allow anon read, or disable RLS for dev)
//   - If profile insert fails after auth signup → user exists in auth but
//     not in profiles → clean up manually in Supabase dashboard
//   - charity_percentage must be >= 10 (enforced client-side + note in DB)
//   - Metadata stored in signUp({ options: { data: {...} } }) is available
//     as user.user_metadata — useful for debugging
// ============================================================

import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { supabase } from "../api/supabase"

export default function SignupPage() {
  // ---- Form state ----
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [selectedCharity, setSelectedCharity] = useState("") // charity UUID
  const [charityPercent, setCharityPercent] = useState(10)   // default 10, min 10

  // ---- Data & UI state ----
  const [charities, setCharities] = useState([])   // list from DB
  const [loading, setLoading] = useState(false) // button loading state
  const [error, setError] = useState(null)  // error message for UI
  const [fetchingCharities, setFetchingCharities] = useState(true)

  const navigate = useNavigate()

  // ------------------------------------------------------------------
  // STEP 1: Fetch charities from Supabase on component mount
  // DEBUG: If this returns empty, check Supabase RLS on `charities` table
  //        Run in Supabase SQL editor: SELECT * FROM charities LIMIT 5;
  // ------------------------------------------------------------------
  useEffect(() => {
    const loadCharities = async () => {
      console.log("[SignupPage] Fetching charities from DB...")

      const { data, error } = await supabase
        .from("charities")
        .select("id, name") // only fetch what we need
        .order("name", { ascending: true })

      if (error) {
        // Common cause: RLS blocks anon reads. Fix: add policy for SELECT on charities
        console.error("[SignupPage] Failed to fetch charities:", error.message)
        setError("Could not load charities. Please refresh.")
      } else {
        console.log("[SignupPage] Charities loaded:", data.length, "items")
        setCharities(data)

        // Pre-select the first charity to avoid empty submission
        if (data.length > 0) setSelectedCharity(data[0].id)
      }

      setFetchingCharities(false)
    }

    loadCharities()
  }, []) // [] = runs once on mount only

  // ------------------------------------------------------------------
  // STEP 2: Handle signup form submission
  // ------------------------------------------------------------------
  const handleSignup = async () => {
    setError(null) // clear previous errors

    // ---- Client-side validation ----
    if (!email || !password) {
      setError("Email and password are required.")
      return
    }
    if (!selectedCharity) {
      setError("Please select a charity.")
      return
    }
    if (charityPercent < 10) {
      // PRD requirement: minimum 10% charity contribution
      setError("Charity percentage must be at least 10%.")
      return
    }

    setLoading(true)
    console.log("[SignupPage] Attempting signup for:", email)

    // ------------------------------------------------------------------
    // STEP 2a: Create the Supabase auth user
    // We store charity data in user_metadata so it's accessible right away
    // even before the profile row is inserted
    // ------------------------------------------------------------------
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          // These values land in user.user_metadata
          charity_id: selectedCharity,
          charity_percentage: charityPercent,
        },
      },
    })

    if (signupError) {
      // Common errors: "User already registered", "Password too short"
      console.error("[SignupPage] Auth signup error:", signupError.message)
      setError(signupError.message)
      setLoading(false)
      return
    }

    console.log("[SignupPage] Auth signup success. User ID:", data.user?.id)

    // ------------------------------------------------------------------
    // STEP 2b: Insert a matching row into the `profiles` table
    // ⚠️ CRITICAL: Never skip this step! Without it, fetchProfile() will
    //    return null and your dashboard/score pages will crash.
    // DEBUG: If this fails, check Supabase RLS on `profiles`.
    //        The user must be allowed to INSERT their own row.
    //        Policy: (id = auth.uid())
    // ------------------------------------------------------------------

    // 🔥 Ensure user exists after signup
    if (!data.user) {
      setError("Signup failed: user not returned from Supabase")
      setLoading(false)
      return
    }

    const userId = data.user.id

    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: userId,  //  SAFE now
        email: email,
        charity_id: selectedCharity,
        charity_percentage: charityPercent,
        subscription_status: "inactive",
      },
    ])

    if (profileError) {
      console.error("[SignupPage] Profile insert error:", profileError.message)
      // Auth user already created — log this so you can clean up in Supabase dashboard
      console.warn("[SignupPage] Auth user created but profile insert FAILED. User ID:", data.user.id)
      setError("Signup succeeded but profile setup failed. Contact support.")
      setLoading(false)
      return
    }

    console.log("[SignupPage] Profile created successfully for:", email)
    setLoading(false)

    // Success! Redirect to login page
    navigate("/login")
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
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join Golf Charity and start making a difference</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="auth-error" role="alert">
            ⚠️ {error}
          </div>
        )}

        {/* ---- Email Field ---- */}
        <div className="field-group">
          <label htmlFor="signup-email" className="field-label">Email</label>
          <input
            id="signup-email"
            type="email"
            className="field-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        {/* ---- Password Field ---- */}
        <div className="field-group">
          <label htmlFor="signup-password" className="field-label">Password</label>
          <input
            id="signup-password"
            type="password"
            className="field-input"
            placeholder="Minimum 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        {/* ---- Charity Dropdown ----
             Populated from `charities` table via useEffect above.
             DEBUG: If this shows "Loading..." forever → check network tab for the
             Supabase request; likely an RLS policy blocking anonymous reads. */}
        <div className="field-group">
          <label htmlFor="signup-charity" className="field-label">Choose Your Charity</label>
          {fetchingCharities ? (
            <p className="field-loading">Loading charities...</p>
          ) : (
            <select
              id="signup-charity"
              className="field-select"
              value={selectedCharity}
              onChange={(e) => {
                console.log("[SignupPage] Charity selected:", e.target.value)
                setSelectedCharity(e.target.value)
              }}
            >
              <option value="" disabled>Select a charity</option>
              {charities.map((charity) => (
                <option key={charity.id} value={charity.id}>
                  {charity.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* ---- Charity % Slider ----
             PRD requirement: minimum 10%, maximum 100%.
             The `min` attribute on the range input enforces this in the UI.
             We also guard against it in handleSignup() for extra safety. */}
        <div className="field-group">
          <label htmlFor="signup-charity-pct" className="field-label">
            Charity Contribution: <span className="pct-badge">{charityPercent}%</span>
          </label>
          <input
            id="signup-charity-pct"
            type="range"
            className="field-slider"
            min={10}    // PRD requirement: cannot go below 10%
            max={100}
            step={1}
            value={charityPercent}
            onChange={(e) => {
              const val = Number(e.target.value)
              console.log("[SignupPage] Charity % changed to:", val)
              setCharityPercent(val)
            }}
          />
          <div className="slider-labels">
            <span>10%</span>
            <span>100%</span>
          </div>
        </div>

        {/* ---- Signup Button ---- */}
        <button
          id="signup-btn"
          className="auth-btn"
          onClick={handleSignup}
          disabled={loading || fetchingCharities}
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        {/* ---- Link to Login ---- */}
        <p className="auth-switch">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">Log in</Link>
        </p>
      </div>
    </div>
  )
}
