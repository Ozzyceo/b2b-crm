import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";

const EVENT_TYPES = ["Personal Appointment", "Team Meeting", "Training", "Client Call", "BPM Event", "Field Training", "Other"];

export default function CalendarSection({ user }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [view, setView] = useState("upcoming");
  const [form, setForm] = useState({
    title: "", event_type: "Personal Appointment", event_date: "", event_time: "",
    location: "", description: "", trainer_requested: false
  });

  useEffect(() => { fetchEvents(); }, [user]);

  const fetchEvents = async () => {
    setLoading(true);
    const { data } = await supabase.from("calendar_events").select("*").eq("owner_id", user.id).order("event_date", { ascending: true });
    setEvents(data || []);
    setLoading(false);
  };

  const openAdd = () => {
    setEditEvent(null);
    setForm({ title: "", event_type: "Personal Appointment", event_date: "", event_time: "", location: "", description: "", trainer_requested: false });
    setShowModal(true);
  };

  const openEdit = (e) => {
    setEditEvent(e);
    setForm({ title: e.title || "", event_type: e.event_type || "Personal Appointment", event_date: e.event_date || "", event_time: e.event_time || "", location: e.location || "", description: e.description || "", trainer_requested: e.trainer_requested || false });
    setShowModal(true);
  };

  const saveEvent = async (ev) => {
    ev.preventDefault();
    const payload = { ...form, owner_id: user.id };
    if (editEvent) {
      await supabase.from("calendar_events").update(payload).eq("id", editEvent.id);
    } else {
      await supabase.from("calendar_events").insert(payload);
    }
    setShowModal(false);
    fetchEvents();
  };

  const deleteEvent = async (id) => {
    if (!confirm("Delete this event?")) return;
    await supabase.from("calendar_events").delete().eq("id", id);
    fetchEvents();
  };

  const today = new Date().toISOString().split("T")[0];
  const upcoming = events.filter((e) => e.event_date >= today);
  const past = events.filter((e) => e.event_date < today);
  const displayed = view === "upcoming" ? upcoming : past;

  const typeColor = (t) => {
    const map = { "Personal Appointment": "blue", "Team Meeting": "green", "Training": "purple", "Client Call": "orange", "BPM Event": "green", "Field Training": "purple", "Other": "blue" };
    return map[t] || "blue";
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">Calendar</h2>
          <p className="page-subtitle">{upcoming.length} upcoming events</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Event</button>
      </div>

      <div className="view-toggle">
        <button className={`toggle-btn${view === "upcoming" ? " active" : ""}`} onClick={() => setView("upcoming")}>
          Upcoming ({upcoming.length})
        </button>
        <button className={`toggle-btn${view === "past" ? " active" : ""}`} onClick={() => setView("past")}>
          Past ({past.length})
        </button>
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner"></div><p>Loading events...</p></div>
      ) : (
        <div className="events-grid">
          {displayed.length === 0 ? (
            <div className="empty-state">
              <p>{view === "upcoming" ? "No upcoming events. Schedule something!" : "No past events."}</p>
            </div>
          ) : displayed.map((e) => (
            <div key={e.id} className="event-card">
              <div className={`event-type-bar event-type-${typeColor(e.event_type)}`}></div>
              <div className="event-content">
                <div className="event-header">
                  <span className={`badge badge-${typeColor(e.event_type)}`}>{e.event_type}</span>
                  {e.trainer_requested && <span className="badge badge-purple">Trainer Requested</span>}
                </div>
                <h3 className="event-title">{e.title}</h3>
                <div className="event-meta">
                  <span className="event-date">{new Date(e.event_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
                  {e.event_time && <span className="event-time">{e.event_time}</span>}
                  {e.location && <span className="event-location">{e.location}</span>}
                </div>
                {e.description && <p className="event-desc">{e.description}</p>}
                <div className="event-actions">
                  <button className="btn-icon" onClick={() => openEdit(e)}>Edit</button>
                  <button className="btn-icon btn-icon-danger" onClick={() => deleteEvent(e.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(ev) => ev.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editEvent ? "Edit Event" : "Add Event"}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>X</button>
            </div>
            <form onSubmit={saveEvent} className="modal-body">
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">Event Title *</label>
                  <input className="form-input" type="text" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Event Type</label>
                  <select className="form-input" value={form.event_type} onChange={(e) => setForm({...form, event_type: e.target.value})}>
                    {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input className="form-input" type="date" value={form.event_date} onChange={(e) => setForm({...form, event_date: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input className="form-input" type="time" value={form.event_time} onChange={(e) => setForm({...form, event_time: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input className="form-input" type="text" value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={3} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={form.trainer_requested} onChange={(e) => setForm({...form, trainer_requested: e.target.checked})} />
                  <span>Request a Trainer</span>
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
