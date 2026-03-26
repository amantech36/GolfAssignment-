import { useState, useEffect } from "react"
import { supabase } from "../api/supabase"

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [msg, setMsg] = useState("")

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("email")
    setUsers(data || [])
    setLoading(false)
  }

  const filtered = users.filter((u) =>
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const handleEdit = (user) => {
    setEditingUser(user)
    setEditForm({
      email: user.email || "",
      subscription_status: user.subscription_status || "inactive",
      charity_percentage: user.charity_percentage || 10,
    })
    setMsg("")
  }

  const handleSave = async () => {
    const { error } = await supabase
      .from("profiles")
      .update(editForm)
      .eq("id", editingUser.id)

    if (error) {
      setMsg(" " + error.message)
    } else {
      setMsg(" User updated!")
      setEditingUser(null)
      loadUsers()
    }
  }

  if (loading) return <div className="loading-text">Loading users...</div>

  return (
    <div>
      <h1>👥 User Management</h1>

      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          className="field-input"
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 400 }}
        />
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Subscription</th>
              <th>Charity %</th>
              <th>End Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>
                  <span className={`status-badge ${u.subscription_status === "active" ? "status-active" : "status-inactive"}`}>
                    {u.subscription_status}
                  </span>
                </td>
                <td>{u.charity_percentage}%</td>
                <td>{u.subscription_end_date ? new Date(u.subscription_end_date).toLocaleDateString() : "—"}</td>
                <td>
                  <div className="admin-table-actions">
                    <button onClick={() => handleEdit(u)}>Edit</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="empty-state"><p>No users found.</p></div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit User</h2>
            <p className="text-muted text-sm" style={{ marginBottom: 16 }}>{editingUser.email}</p>

            <div className="field-group" style={{ marginBottom: 16 }}>
              <label className="field-label">Subscription Status</label>
              <select
                className="field-select"
                value={editForm.subscription_status}
                onChange={(e) => setEditForm({ ...editForm, subscription_status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="cancelled">Cancelled</option>
                <option value="lapsed">Lapsed</option>
              </select>
            </div>

            <div className="field-group" style={{ marginBottom: 16 }}>
              <label className="field-label">Charity Percentage</label>
              <input
                type="number"
                className="field-input"
                min={10}
                max={100}
                value={editForm.charity_percentage}
                onChange={(e) => setEditForm({ ...editForm, charity_percentage: Number(e.target.value) })}
              />
            </div>

            {msg && (
              <div className={`pricing-notice ${msg.includes("") ? "pricing-notice--success" : "pricing-notice--error"}`} style={{ maxWidth: "100%", marginBottom: 16 }}>
                {msg}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => setEditingUser(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleSave}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
