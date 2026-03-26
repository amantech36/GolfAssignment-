// ============================================================
// PricePages.jsx
// PURPOSE: Public pricing page — Monthly & Yearly plans.
//          Integrates Razorpay checkout.
//
// FLOW:
//   1. User clicks a plan → POST /api/create-order → Razorpay order created
//   2. Razorpay modal opens (loaded from CDN script)
//   3. On payment success → POST /api/verify-payment → Supabase updated
//
// DEBUG TIPS:
//   - "Razorpay is not defined" → CDN script not loaded, check index.html
//   - 500 from /api/create-order → check server/.env for RAZORPAY_KEY_ID/SECRET
//   - Supabase not updating → check server/.env SUPABASE_SERVICE_KEY
// ============================================================

import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"

import {useAuth} from "../context/AuthContext" 
// ── Plan definitions ──────────────────────────────────────────
const PLANS = [
  {
    id: "monthly",
    label: "Monthly",
    price: 20,
    currency: "USD",
    // Razorpay expects amount in smallest currency unit (paise/cents)
    amountInCents: 2000,
    period: "/ month",
    badge: null,
    perks: [
      " Unlimited score submissions",
      " Full leaderboard access",
      " Charity donation tracking",
      " Monthly performance reports",
      " Cancel any time",
    ],
  },
  {
    id: "yearly",
    label: "Yearly",
    price: 200,
    currency: "USD",
    amountInCents: 20000,
    period: "/ year",
    badge: "Save $40",
    perks: [
      " Unlimited score submissions",
      " Full leaderboard access",
      " Charity donation tracking",
      " Monthly performance reports",
      " 2 months FREE vs monthly",
      " Priority support",
    ],
  },
]

// ── Helper: load Razorpay script once ─────────────────────────
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

// ── Main component ─────────────────────────────────────────────
export default function PricingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loadingPlan, setLoadingPlan] = useState(null) // which plan is processing
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Pre-load Razorpay SDK when page mounts
  useEffect(() => {
    loadRazorpayScript()
  }, [])

  // ── Checkout handler ──────────────────────────────────────────
  const handleSubscribe = async (plan) => {
    setError("")
    setSuccess("")

    // Redirect to login if not authenticated
    if (!user) {
      navigate("/login", { state: { from: "/pricing" } })
      return
    }

    setLoadingPlan(plan.id)

    try {
      // 1. Load Razorpay SDK
      const loaded = await loadRazorpayScript()
      if (!loaded) throw new Error("Failed to load Razorpay SDK. Check your internet connection.")

      // 2. Create order on our Express backend
      const res = await fetch("http://localhost:3001/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: plan.amountInCents,
          currency: plan.currency,
          planId: plan.id,
          userId: user.id,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Server error ${res.status}`)
      }

      const { orderId, keyId } = await res.json()

      // 3. Open Razorpay checkout modal
      const options = {
        key: keyId,
        amount: plan.amountInCents,
        currency: plan.currency,
        name: "Golf Charity Club",
        description: `${plan.label} Subscription`,
        image: "https://img.icons8.com/emoji/96/golf.png",
        order_id: orderId,
        prefill: {
          email: user.email,
        },
        theme: {
          color: "#aa3bff",
        },
        handler: async (response) => {
          // 4. Verify payment on backend → Supabase updated there
          try {
            const verifyRes = await fetch("http://localhost:3001/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: user.id,
                planId: plan.id,
              }),
            })

            if (!verifyRes.ok) throw new Error("Payment verification failed")

            setSuccess(`🎉 You're now a ${plan.label} member! Your subscription is active.`)
          } catch (verifyErr) {
            setError("Payment succeeded but verification failed. Please contact support.")
            console.error("[PricingPage] verify error:", verifyErr)
          } finally {
            setLoadingPlan(null)
          }
        },
        modal: {
          ondismiss: () => {
            setLoadingPlan(null)
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on("payment.failed", (response) => {
        setError(`Payment failed: ${response.error.description}`)
        setLoadingPlan(null)
      })
      rzp.open()
    } catch (err) {
      console.error("[PricingPage] handleSubscribe error:", err)
      setError(err.message || "Something went wrong. Please try again.")
      setLoadingPlan(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="pricing-page">
      {/* ── Header ── */}
      <div className="pricing-header">
        <Link to="/" className="pricing-back-link">← Back to Dashboard</Link>
        <div className="pricing-badge">⛳ Golf Charity Club</div>
        <h1 className="pricing-title">Simple, Transparent Pricing</h1>
        <p className="pricing-subtitle">
          Play more golf, give more to charity. All plans include full platform access.
        </p>
      </div>

      {/* ── Status banners ── */}
      {error && (
        <div className="pricing-notice pricing-notice--error" role="alert">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="pricing-notice pricing-notice--success" role="status">
          {success}
          <Link to="/" className="pricing-notice-link">Go to Dashboard →</Link>
        </div>
      )}

      {/* ── Plan cards ── */}
      <div className="pricing-cards">
        {PLANS.map((plan) => {
          const isYearly = plan.id === "yearly"
          const isProcessing = loadingPlan === plan.id

          return (
            <div
              key={plan.id}
              className={`pricing-card ${isYearly ? "pricing-card--featured" : ""}`}
            >
              {plan.badge && (
                <div className="pricing-card-badge">{plan.badge}</div>
              )}

              <div className="pricing-card-header">
                <span className="pricing-plan-label">{plan.label}</span>
                <div className="pricing-amount">
                  <span className="pricing-currency">$</span>
                  <span className="pricing-price">{plan.price}</span>
                  <span className="pricing-period">{plan.period}</span>
                </div>
                {isYearly && (
                  <p className="pricing-monthly-equiv">
                    Only $16.67/month — billed annually
                  </p>
                )}
              </div>

              <ul className="pricing-perks">
                {plan.perks.map((perk) => (
                  <li key={perk} className="pricing-perk">
                    {perk}
                  </li>
                ))}
              </ul>

              <button
                className={`pricing-cta ${isYearly ? "pricing-cta--featured" : ""}`}
                onClick={() => handleSubscribe(plan)}
                disabled={loadingPlan !== null}
                id={`subscribe-${plan.id}`}
              >
                {isProcessing ? (
                  <span className="pricing-spinner" aria-label="Processing…" />
                ) : user ? (
                  `Subscribe ${plan.label}`
                ) : (
                  "Get Started"
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* ── Footer note ── */}
      <p className="pricing-footer-note">
        🔒 Payments secured by{" "}
        <a
          href="https://razorpay.com"
          target="_blank"
          rel="noopener noreferrer"
          className="pricing-rp-link"
        >
          Razorpay
        </a>
        . Cancel anytime from your dashboard.
        {!user && (
          <>
            {" "}·{" "}
            <Link to="/login" className="pricing-rp-link">
              Log in
            </Link>{" "}
            or{" "}
            <Link to="/signup" className="pricing-rp-link">
              sign up
            </Link>{" "}
            to subscribe.
          </>
        )}
      </p>
    </div>
  )
}


