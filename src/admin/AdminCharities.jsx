import { useState, useEffect } from "react"
import { supabase } from "../api/supabase"

export default function AdminCharities() {
  const [charities, setCharities] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: "", description: "", image_url: "", is_featured: false })
  const [msg, setMsg] = useState("")

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data } = await supabase.from("charities").select("*").order("name")
    setCharities(data || [])
    setLoading(false)
  }

  const openNew = () => {
    setEditing("new")
    setForm({ name: "", description: "", image_url: "", is_featured: false })
    setMsg("")
  }

  const openEdit = (c) => {
    setEditing(c.id)
    setForm({ name: c.name, description: c.description || "", image_url: c.image_url || "", is_featured: c.is_featured })
    setMsg("")
  }

  const handleSave = async () => {
    setMsg("")
    if (!form.name.trim()) { setMsg("Name is required"); return }

    if (editing === "new") {
      const { error } = await supabase.from("charities").insert([form])
      if (error) { setMsg(" " + error.message); return }
      setMsg(" Charity added!")
    } else {
      const { error } = await supabase.from("charities").update(form).eq("id", editing)
      if (error) { setMsg(" " + error.message); return }
      setMsg(" Charity updated!")
    }
    setEditing(null)
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm("Delete this charity?")) return
    await supabase.from("charities").delete().eq("id", id)
    load()
  }

  if (loading) return <div className="loading-text">Loading charities...</div>

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Charity Management</h1>
        <button className="btn btn-primary btn-sm" onClick={openNew}>+ Add Charity</button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Featured</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {charities.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{c.name}</td>
                <td>{c.is_featured ? "" : "—"}</td>
                <td style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.description || "—"}
                </td>
                <td>
                  <div className="admin-table-actions">
                    <button onClick={() => openEdit(c)}>Edit</button>
                    <button onClick={() => handleDelete(c.id)} style={{ borderColor: "rgba(239,68,68,0.3)", color: "#fca5a5" }}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {charities.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon"></div>
          <h3>No charities yet</h3>
          <p>Add your first charity above!</p>
        </div>
      )}

      {/* Edit/Add Modal */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing === "new" ? "Add Charity" : "Edit Charity"}</h2>

            <div className="field-group" style={{ marginBottom: 16 }}>
              <label className="field-label">Name *</label>
              <input
                className="field-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Charity name"
              />
            </div>

            <div className="field-group" style={{ marginBottom: 16 }}>
              <label className="field-label">Description</label>
              <textarea
                className="field-textarea"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What does this charity do?"
              />
            </div>

            <div className="field-group" style={{ marginBottom: 16 }}>
              <label className="field-label">Image URL</label>
              <input
                className="field-input"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="field-group" style={{ marginBottom: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "var(--text-secondary)" }}>
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                />
                ⭐ Featured Charity
              </label>
            </div>

            {msg && (
              <div className={`pricing-notice ${msg.includes("") ? "pricing-notice--success" : "pricing-notice--error"}`} style={{ maxWidth: "100%", marginBottom: 16 }}>
                {msg}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleSave}>
                {editing === "new" ? "Add Charity" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
