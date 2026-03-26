// ============================================================
// server/server.jsx  (run with: node server/server.jsx)
// PURPOSE: Express backend for Razorpay payment integration.
//
// ENDPOINTS:
//   POST /api/create-order   — creates a Razorpay order, returns { orderId, keyId }
//   POST /api/verify-payment — verifies HMAC signature, updates Supabase
//
// REQUIRED ENV (server/.env):
//   RAZORPAY_KEY_ID         — from Razorpay dashboard (test: rzp_test_...)
//   RAZORPAY_KEY_SECRET     — from Razorpay dashboard
//   SUPABASE_URL            — same as VITE_SUPABASE_URL in root .env
//   SUPABASE_SERVICE_KEY    — Supabase service-role key (Settings → API)
//   PORT                    — optional, defaults to 3001
//
// DEBUG TIPS:
//   - 401 from Razorpay → wrong KEY_ID or KEY_SECRET
//   - Signature mismatch → body is being parsed before raw bytes are captured
//   - Supabase 403 → you used anon key not service-role key
// ============================================================

import "dotenv/config"
import express from "express"
import cors from "cors"
import crypto from "crypto"
import Razorpay from "razorpay"
import { createClient } from "@supabase/supabase-js"

const app = express()
const PORT = process.env.PORT || 3001

// ── CORS — allow the Vite dev server ──────────────────────────
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
)

// ── Body parser ───────────────────────────────────────────────
app.use(express.json())

// ── Razorpay client ───────────────────────────────────────────
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// ── Supabase admin client (service-role bypasses RLS) ─────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// ── Health check ──────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() })
})

// ============================================================
// POST /api/create-order
// Body: { amount, currency, planId, userId }
// Returns: { orderId, keyId }
// ============================================================
app.post("/api/create-order", async (req, res) => {
  const { amount, currency = "INR", planId, userId } = req.body

  console.log("[create-order] planId=%s userId=%s amount=%d", planId, userId, amount)

  if (!amount || !userId) {
    return res.status(400).json({ error: "amount and userId are required" })
  }

  try {
    const order = await razorpay.orders.create({
      amount,           // in smallest unit (paise for INR, cents for USD)
      currency,
      receipt: `receipt_${userId}_${planId}_${Date.now()}`,
      notes: { userId, planId },
    })

    console.log("[create-order] Razorpay order created:", order.id)
    return res.json({
      orderId: order.id,
      keyId: process.env.RAZORPAY_KEY_ID,
    })
  } catch (err) {
    console.error("[create-order] Razorpay error:", err)
    return res.status(500).json({ error: err.message || "Failed to create order" })
  }
})

// ============================================================
// POST /api/verify-payment
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, planId }
// Verifies HMAC-SHA256, then updates Supabase profiles row.
// ============================================================
app.post("/api/verify-payment", async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    userId,
    planId,
  } = req.body

  console.log("[verify-payment] userId=%s planId=%s payment=%s", userId, planId, razorpay_payment_id)

  // ── 1. Verify HMAC signature ───────────────────────────────
  const body = razorpay_order_id + "|" + razorpay_payment_id
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex")

  if (expectedSignature !== razorpay_signature) {
    console.warn("[verify-payment] Signature mismatch — possible tampering")
    return res.status(400).json({ error: "Payment signature invalid" })
  }

  console.log("[verify-payment] Signature verified ✅")

  // ── 2. Determine subscription end date based on plan ───────
  const intervalMap = {
    monthly: "1 month",
    yearly: "1 year",
  }
  const interval = intervalMap[planId] || "1 month"

  // ── 3. Update Supabase profiles table ──────────────────────
  // Uses service-role key so RLS is bypassed (safe server-side only).
  const { error: dbError } = await supabase.rpc("activate_subscription", {
    p_user_id: userId,
    p_interval: interval,
    p_payment_id: razorpay_payment_id,
  }).catch(() => ({ error: null }))  // fallback to direct update if RPC doesn't exist

  if (dbError) {
    console.warn("[verify-payment] RPC not found, falling back to direct update")
  }

  // Direct update (always run as safety net)
  const endDate =
    planId === "yearly"
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      subscription_status: "active",
      subscription_end_date: endDate,
      razorpay_payment_id: razorpay_payment_id,
    })
    .eq("id", userId)

  if (updateError) {
    console.error("[verify-payment] Supabase update error:", updateError.message)
    return res.status(500).json({ error: "Failed to activate subscription in database" })
  }

  console.log("[verify-payment] Subscription activated in Supabase for user:", userId)
  return res.json({ success: true, message: "Subscription activated" })
})

// ── Start server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Golf Charity API server running on http://localhost:${PORT}`)
  console.log(`   Razorpay Key ID: ${process.env.RAZORPAY_KEY_ID || "⚠️  NOT SET"}`)
  console.log(`   Supabase URL:    ${process.env.SUPABASE_URL || "⚠️  NOT SET"}\n`)
})
