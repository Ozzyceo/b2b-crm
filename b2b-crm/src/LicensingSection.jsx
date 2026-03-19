import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";

const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];
const LICENSE_TYPES = ["Life & Health", "Property & Casualty", "Securities 6", "Securities 63", "Series 65", "Other"];
const STATUSES = ["Active", "Pending", "Expired", "Suspended"];

export default function LicensingSection({ user }) {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editLicense, setEditLicense] = useState(null);
  const [form, setForm] = useState({
    state: "TX", license_type: "Life & Health", license_number: "", status: "Active",
    issue_date: "", expiry_date: "", notes: ""
  });

  useEffect(() => { fetchLicenses(); }, [user]);

  const fetchLicenses = async () => {
    setLoading(true);
    const { data } = await supabase.from("licensing").select("*").eq("agent_id", user.id).order("created_at", { ascending: false });
    setLicenses(data || []);
    setLoading(false);
  };

  const openAdd = () => {
    setEditLicense(null);
    setForm({ state: "TX", license_type: "Life & Health", license_number: "", status: "Active", issue_date: "", expiry_date: "", notes: "" });
    setShowModal(true);
  };

  const openEdit = (l) => {
    setEditLicense(l);
    setForm({ state: l.state || "TX", license_type: l.license_type || "Life & Health", license_number: l.license_number || "", status: l.status || "Active", issue_date: l.issue_date || "", expiry_date: l.expiry_date || "", notes: l.notes || "" });
    setShowModal(true);
  };

  const saveLicense = async (e) => {
    e.preventDefault();
    const payload = { ...form, agent_id: user.id };
    if (editLicense) {
      await supabase.from("licensing").update(payload).eq("id", editLicense.id);
    } else {
      await supabase.from("licensing").insert(payload);
    }
    setShowModal(false);
    fetchLicenses();
  };

  const deleteLicense = async (id) => {
    if (!confirm("Delete this license?")) return;
    await supabase.from("licensing").delete().eq("id", id);
    fetchLicenses();
  };

  const statusColor = (s) => ({ Active: "green", Pending: "orange", Expired: "red", Suspended: "red" }[s] || "blue");

  const daysUntilExpiry = (date) => {
    if (!date) return null;
    const diff = new Date(date) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">Licensing</h2>
          <p className="page-subtitle">{licenses.length} licenses tracked</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add License</button>
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner"></div><p>Loading licenses...</p></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>State</th><th>License Type</th><th>License #</th>
                  <th>Status</th><th>Issue Date</th><th>Expiry Date</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {licenses.length === 0 ? (
                  <tr><td colSpan={7} className="empty-row">No licenses added yet. Add your first license!</td></tr>
                ) : licenses.map((l) => {
                  const days = daysUntilExpiry(l.expiry_date);
                  return (
                    <tr key={l.id}>
                      <td><span className="badge badge-blue">{l.state}</span></td>
                      <td>{l.license_type}</td>
                      <td className="mono">{l.license_number || "-"}</td>
                      <td><span className={`badge badge-${statusColor(l.status)}`}>{l.status}</span></td>
                      <td>{l.issue_date ? new Date(l.issue_date + "T00:00:00").toLocaleDateString() : "-"}</td>
                      <td>
                        {l.expiry_date ? (
                          <span className={days !== null && days <= 90 ? "expiry-warning" : ""}>
                            {new Date(l.expiry_date + "T00:00:00").toLocaleDateString()}
                            {days !== null && days <= 90 && <span className="expiry-badge"> ({days}d)</span>}
                          </span>
                        ) : "-"}
                      </td>
                      <td>
                        <button className="btn-icon" onClick={() => openEdit(l)}>Edit</button>
                        <button className="btn-icon btn-icon-danger" onClick={() => deleteLicense(l.id)}>Del</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editLicense ? "Edit License" : "Add License"}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>X</button>
            </div>
            <form onSubmit={saveLicense} className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">State</label>
                  <select className="form-input" value={form.state} onChange={(e) => setForm({...form, state: e.target.value})}>
                    {STATES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">License Type</label>
                  <select className="form-input" value={form.license_type} onChange={(e) => setForm({...form, license_type: e.target.value})}>
                    {LICENSE_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">License Number</label>
                  <input className="form-input" type="text" value={form.license_number} onChange={(e) => setForm({...form, license_number: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Issue Date</label>
                  <input className="form-input" type="date" value={form.issue_date} onChange={(e) => setForm({...form, issue_date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Expiry Date</label>
                  <input className="form-input" type="date" value={form.expiry_date} onChange={(e) => setForm({...form, expiry_date: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={2} value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save License</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
