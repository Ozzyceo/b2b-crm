import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";

const PRODUCT_TYPES = ["IUL", "Term Life", "Whole Life", "Annuity", "Final Expense", "Medicare", "Other"];
const STATUSES = ["Pending", "Submitted", "Approved", "Issued", "Declined", "Lapsed"];

export default function ProductionSection({ user }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [form, setForm] = useState({
    client_name: "", product_type: "IUL", face_amount: "", premium: "", status: "Pending",
    policy_number: "", submit_date: "", issue_date: "", notes: ""
  });

  useEffect(() => { fetchRecords(); }, [user]);

  const fetchRecords = async () => {
    setLoading(true);
    const { data } = await supabase.from("production").select("*").eq("agent_id", user.id).order("created_at", { ascending: false });
    setRecords(data || []);
    setLoading(false);
  };

  const openAdd = () => {
    setEditRecord(null);
    setForm({ client_name: "", product_type: "IUL", face_amount: "", premium: "", status: "Pending", policy_number: "", submit_date: "", issue_date: "", notes: "" });
    setShowModal(true);
  };

  const openEdit = (r) => {
    setEditRecord(r);
    setForm({ client_name: r.client_name || "", product_type: r.product_type || "IUL", face_amount: r.face_amount || "", premium: r.premium || "", status: r.status || "Pending", policy_number: r.policy_number || "", submit_date: r.submit_date || "", issue_date: r.issue_date || "", notes: r.notes || "" });
    setShowModal(true);
  };

  const saveRecord = async (e) => {
    e.preventDefault();
    const payload = { ...form, agent_id: user.id, face_amount: parseFloat(form.face_amount) || 0, premium: parseFloat(form.premium) || 0 };
    if (editRecord) {
      await supabase.from("production").update(payload).eq("id", editRecord.id);
    } else {
      await supabase.from("production").insert(payload);
    }
    setShowModal(false);
    fetchRecords();
  };

  const deleteRecord = async (id) => {
    if (!confirm("Delete this production record?")) return;
    await supabase.from("production").delete().eq("id", id);
    fetchRecords();
  };

  const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);
  const statusColor = (s) => ({ Pending: "orange", Submitted: "blue", Approved: "green", Issued: "green", Declined: "red", Lapsed: "red" }[s] || "blue");

  const totalPremium = records.reduce((sum, r) => sum + (r.premium || 0), 0);
  const issuedPremium = records.filter((r) => r.status === "Issued").reduce((sum, r) => sum + (r.premium || 0), 0);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">Production Tracker</h2>
          <p className="page-subtitle">{records.length} policies tracked</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Production</button>
      </div>

      <div className="stats-grid stats-grid-2">
        <div className="stat-card stat-card-green">
          <div className="stat-info">
            <div className="stat-value">{fmt(totalPremium)}</div>
            <div className="stat-label">Total Written Premium</div>
          </div>
        </div>
        <div className="stat-card stat-card-purple">
          <div className="stat-info">
            <div className="stat-value">{fmt(issuedPremium)}</div>
            <div className="stat-label">Issued Premium</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner"></div><p>Loading production...</p></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client</th><th>Product</th><th>Face Amount</th><th>Premium</th>
                  <th>Status</th><th>Policy #</th><th>Submit Date</th><th>Issue Date</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td colSpan={9} className="empty-row">No production records yet. Add your first policy!</td></tr>
                ) : records.map((r) => (
                  <tr key={r.id}>
                    <td className="contact-name">{r.client_name}</td>
                    <td><span className="badge badge-blue">{r.product_type}</span></td>
                    <td className="mono">{fmt(r.face_amount)}</td>
                    <td className="mono">{fmt(r.premium)}</td>
                    <td><span className={`badge badge-${statusColor(r.status)}`}>{r.status}</span></td>
                    <td>{r.policy_number || "-"}</td>
                    <td>{r.submit_date ? new Date(r.submit_date + "T00:00:00").toLocaleDateString() : "-"}</td>
                    <td>{r.issue_date ? new Date(r.issue_date + "T00:00:00").toLocaleDateString() : "-"}</td>
                    <td>
                      <button className="btn-icon" onClick={() => openEdit(r)}>Edit</button>
                      <button className="btn-icon btn-icon-danger" onClick={() => deleteRecord(r.id)}>Del</button>
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
              <h3 className="modal-title">{editRecord ? "Edit Production" : "Add Production"}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>X</button>
            </div>
            <form onSubmit={saveRecord} className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Client Name *</label>
                  <input className="form-input" type="text" value={form.client_name} onChange={(e) => setForm({...form, client_name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Product Type</label>
                  <select className="form-input" value={form.product_type} onChange={(e) => setForm({...form, product_type: e.target.value})}>
                    {PRODUCT_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Face Amount</label>
                  <input className="form-input" type="number" placeholder="0" value={form.face_amount} onChange={(e) => setForm({...form, face_amount: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Annual Premium</label>
                  <input className="form-input" type="number" placeholder="0" value={form.premium} onChange={(e) => setForm({...form, premium: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Policy Number</label>
                  <input className="form-input" type="text" value={form.policy_number} onChange={(e) => setForm({...form, policy_number: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Submit Date</label>
                  <input className="form-input" type="date" value={form.submit_date} onChange={(e) => setForm({...form, submit_date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Issue Date</label>
                  <input className="form-input" type="date" value={form.issue_date} onChange={(e) => setForm({...form, issue_date: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={2} value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
