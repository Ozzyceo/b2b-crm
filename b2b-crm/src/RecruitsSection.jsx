import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";

const RECRUIT_STATUSES = ["New", "Contacted", "Interested", "Application Sent", "Licensed", "Active Agent", "Not Interested"];

export default function RecruitsSection({ user }) {
  const [recruits, setRecruits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRecruit, setEditRecruit] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "", phone: "", email: "", status: "New", notes: "", timeline: "", referred_by: ""
  });

  useEffect(() => { fetchRecruits(); }, [user]);

  const fetchRecruits = async () => {
    setLoading(true);
    const { data } = await supabase.from("recruits").select("*").eq("owner_id", user.id).order("created_at", { ascending: false });
    setRecruits(data || []);
    setLoading(false);
  };

  const openAdd = () => {
    setEditRecruit(null);
    setForm({ name: "", phone: "", email: "", status: "New", notes: "", timeline: "", referred_by: "" });
    setShowModal(true);
  };

  const openEdit = (r) => {
    setEditRecruit(r);
    setForm({ name: r.name || "", phone: r.phone || "", email: r.email || "", status: r.status || "New", notes: r.notes || "", timeline: r.timeline || "", referred_by: r.referred_by || "" });
    setShowModal(true);
  };

  const saveRecruit = async (e) => {
    e.preventDefault();
    const payload = { ...form, owner_id: user.id };
    if (editRecruit) {
      await supabase.from("recruits").update(payload).eq("id", editRecruit.id);
    } else {
      await supabase.from("recruits").insert(payload);
    }
    setShowModal(false);
    fetchRecruits();
  };

  const deleteRecruit = async (id) => {
    if (!confirm("Delete this recruit?")) return;
    await supabase.from("recruits").delete().eq("id", id);
    fetchRecruits();
  };

  const statusColor = (s) => {
    const map = { "New": "blue", "Contacted": "orange", "Interested": "green", "Application Sent": "purple", "Licensed": "green", "Active Agent": "green", "Not Interested": "red" };
    return map[s] || "blue";
  };

  const filtered = recruits.filter((r) =>
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.phone?.includes(search) ||
    r.email?.toLowerCase().includes(search.toLowerCase())
  );

  const statusCounts = RECRUIT_STATUSES.reduce((acc, s) => {
    acc[s] = recruits.filter((r) => r.status === s).length;
    return acc;
  }, {});

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">Recruit Tracker</h2>
          <p className="page-subtitle">{recruits.length} total recruits</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Recruit</button>
      </div>

      <div className="status-pills">
        {RECRUIT_STATUSES.map((s) => (
          <div key={s} className={`status-pill status-pill-${statusColor(s)}`}>
            <span className="status-pill-label">{s}</span>
            <span className="status-pill-count">{statusCounts[s]}</span>
          </div>
        ))}
      </div>

      <div className="toolbar">
        <input className="search-bar" type="text" placeholder="Search recruits..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner"></div><p>Loading recruits...</p></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th><th>Phone</th><th>Email</th><th>Status</th>
                  <th>Referred By</th><th>Timeline</th><th>Notes</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="empty-row">No recruits found. Start building your team!</td></tr>
                ) : filtered.map((r) => (
                  <tr key={r.id}>
                    <td className="contact-name">{r.name}</td>
                    <td>{r.phone || "-"}</td>
                    <td>{r.email || "-"}</td>
                    <td><span className={`badge badge-${statusColor(r.status)}`}>{r.status}</span></td>
                    <td>{r.referred_by || "-"}</td>
                    <td>{r.timeline || "-"}</td>
                    <td className="notes-cell">{r.notes ? r.notes.substring(0, 50) + (r.notes.length > 50 ? "..." : "") : "-"}</td>
                    <td>
                      <button className="btn-icon" onClick={() => openEdit(r)}>Edit</button>
                      <button className="btn-icon btn-icon-danger" onClick={() => deleteRecruit(r.id)}>Del</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editRecruit ? "Edit Recruit" : "Add New Recruit"}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>X</button>
            </div>
            <form onSubmit={saveRecruit} className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className="form-input" type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" type="tel" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
                    {RECRUIT_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Referred By</label>
                  <input className="form-input" type="text" value={form.referred_by} onChange={(e) => setForm({...form, referred_by: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Timeline / Target Date</label>
                  <input className="form-input" type="text" placeholder="e.g. Licensed by Q2" value={form.timeline} onChange={(e) => setForm({...form, timeline: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={3} value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} placeholder="Add notes about this recruit..." />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Recruit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
