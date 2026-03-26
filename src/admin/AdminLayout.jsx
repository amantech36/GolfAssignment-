// ============================================================
// AdminLayout.jsx — Shared layout for admin dashboard
// ============================================================

import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { Navigate } from "react-router-dom"
import AdminUsers from "./AdminUsers"
import AdminDraws from "./AdminDraws"
import AdminCharities from "./AdminCharities"
import AdminWinners from "./AdminWinners"
import AdminReports from "./AdminReports"

// Simple admin check — in production, use a role column in profiles
const ADMIN_EMAILS = ["admin@golfcharity.com", "shreyansh@digitalheroes.co.in"]

export default function AdminLayout() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState("users")

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <span className="loading-text">Loading admin...</span>
      </div>
    )
  }

  // Allow any logged-in user for dev/demo — restrict in production
  if (!user) return <Navigate to="/login" replace />

  const tabs = [
    { id: "users", icon: "", label: "Users" },
    { id: "draws", icon: "", label: "Draws" },
    { id: "charities", icon: "", label: "Charities" },
    { id: "winners", icon: "", label: "Winners" },
    { id: "reports", icon: "", label: "Reports" },
  ]

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-title"> Admin Panel</div>
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`sidebar-item ${activeTab === t.id ? "active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            <span className="sidebar-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </aside>

      <main className="admin-main">
        {activeTab === "users" && <AdminUsers />}
        {activeTab === "draws" && <AdminDraws />}
        {activeTab === "charities" && <AdminCharities />}
        {activeTab === "winners" && <AdminWinners />}
        {activeTab === "reports" && <AdminReports />}
      </main>
    </div>
  )
}
