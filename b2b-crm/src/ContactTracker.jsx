import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";

const CALL_TYPES = ["Phone Call", "In Person", "Text", "Email", "Video Call"];
const TAGS = ["Hot Lead", "Warm Lead", "Cold Lead", "Referral", "Business Owner", "Follow Up", "No Call"];

export default function ContactTracker({ user }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editContact, setEditContact] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "", phone: "", email: "", tags: [], good_time: "", call_type: "Phone Call",
    call_logs: "", extra_notes: "", call_back: "", no_call: false
  });

  useEffect(() => { fetchContacts(); }, [user]);

  const fetchContacts = async () => {
    setLoading(true);
    const { data } = await supabase.from("contacts").select("*").eq("owner_id", user.id).order("created_at", { ascending: false });
    setContacts(data || []);
    setLoading(false);
  };

  const openAdd = () => {
    setEditContact(null);
    setForm({ name: "", phone: "", email: "", tags: [], good_time: "", call_type: "Phone Call", call_logs: "", extra_notes: "", call_back: "", no_call: false });
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditContact(c);
    setForm({ name: c.name || "", phone: c.phone || "", email: c.email || "", tags: c.tags || [], good_time: c.good_time || "", call_type: c.call_type || "Phone Call", call_logs: c.call_logs || "", extra_notes: c.extra_notes || "", call_back: c.call_back || "", no_call: c.no_call || false });
    setShowModal(true);
  };

  const saveContact = async (e) => {
    e.preventDefault();
    const payload = { ...form, owner_id: user.id };
    if (editContact) {
      await supabase.from("contacts").update(payload).eq("id", editContact.id);
    } else {
      await supabase.from("contacts").insert(payload);
    }
    setShowModal(false);
    fetchContacts();
  };

  const deleteContact = async (id) => {
    if (!confirm("Delete this contact?")) return;
    await supabase.from("contacts").delete().eq("id", id);
    fetchContacts();
  };

  const toggleTag = (tag) => {
    setForm((f) => ({
      ...f, tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag]
    }));
  };

  const filtered = contacts.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">Contact Tracker</h2>
          <p className="page-subtitle">{contacts.length} contacts</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Contact</button>
      </div>

      <div className="toolbar">
        <input className="search-bar" type="text" placeholder="Search contacts..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner"></div><p>Loading contacts...</p></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th><th>Phone</th><th>Email</th><th>Tags</th>
                  <th>Good Time</th><th>Call Type</th><th>Call Back</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="empty-row">No contacts found. Add your first contact!</td></tr>
                ) : filtered.map((c) => (
                  <tr key={c.id} className={c.no_call ? "no-call-row" : ""}>
                    <td className="contact-name">{c.name}{c.no_call && <span className="badge badge-red ml-1">No Call</span>}</td>
                    <td>{c.phone || "-"}</td>
                    <td>{c.email || "-"}</td>
                    <td>
                      <div className="tag-list">
                        {(c.tags || []).map((t) => <span key={t} className="tag">{t}</span>)}
                      </div>
                    </td>
                    <td>{c.good_time || "-"}</td>
                    <td>{c.call_type || "-"}</td>
                    <td>{c.call_back ? new Date(c.call_back).toLocaleDateString() : "-"}</td>
                    <td>
                      <button className="btn-icon" onClick={() => openEdit(c)} title="Edit">Edit</button>
                      <button className="btn-icon btn-icon-danger" onClick={() => deleteContact(c.id)} title="Delete">Del</button>
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
              <h3 className="modal-title">{editContact ? "Edit Contact" : "Add Contact"}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>X</button>
            </div>
            <form onSubmit={saveContact} className="modal-body">
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
                  <label className="form-label">Good Time to Call</label>
                  <input className="form-input" type="text" placeholder="e.g. Weekdays 5-7pm" value={form.good_time} onChange={(e) => setForm({...form, good_time: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Call Type</label>
                  <select className="form-input" value={form.call_type} onChange={(e) => setForm({...form, call_type: e.target.value})}>
                    {CALL_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Call Back Date</label>
                  <input className="form-input" type="date" value={form.call_back} onChange={(e) => setForm({...form, call_back: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Tags</label>
                <div className="tag-selector">
                  {TAGS.map((t) => (
                    <button key={t} type="button" className={`tag-btn${form.tags.includes(t) ? " active" : ""}`} onClick={() => toggleTag(t)}>{t}</button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Call Logs</label>
                <textarea className="form-input" rows={3} value={form.call_logs} onChange={(e) => setForm({...form, call_logs: e.target.value})} placeholder="Log call notes here..." />
              </div>
              <div className="form-group">
                <label className="form-label">Extra Notes</label>
                <textarea className="form-input" rows={2} value={form.extra_notes} onChange={(e) => setForm({...form, extra_notes: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={form.no_call} onChange={(e) => setForm({...form, no_call: e.target.checked})} />
                  <span>No Call List</span>
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Contact</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
