import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function Dashboard({ user, profile }) {
  const [stats, setStats] = useState({ contacts: 0, recruits: 0, production: 0, events: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, [user]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [contacts, recruits, production, events] = await Promise.all([
        supabase.from("contacts").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
        supabase.from("recruits").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
        supabase.from("production").select("premium").eq("agent_id", user.id),
        supabase.from("calendar_events").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
      ]);
      const totalPremium = (production.data || []).reduce((sum, r) => sum + (r.premium || 0), 0);
      setStats({ contacts: contacts.count || 0, recruits: recruits.count || 0, production: totalPremium, events: events.count || 0 });
      const { data: activity } = await supabase.from("activity").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5);
      setRecentActivity(activity || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const statCards = [
    { label: "Total Contacts", value: stats.contacts, icon: "Contacts", color: "blue", sub: "tracked contacts" },
    { label: "Recruits", value: stats.recruits, icon: "Recruits", color: "green", sub: "in pipeline" },
    { label: "Total Premium", value: fmt(stats.production), icon: "Premium", color: "purple", sub: "written production" },
    { label: "Appointments", value: stats.events, icon: "Events", color: "orange", sub: "scheduled" },
  ];

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">Welcome back, {profile?.full_name?.split(" ")[0] || "Agent"}</p>
        </div>
        <div className={`badge badge-${profile?.role || "agent"}`}>{profile?.role || "agent"}</div>
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner"></div><p>Loading your stats...</p></div>
      ) : (
        <>
          <div className="stats-grid">
            {statCards.map((card) => (
              <div key={card.label} className={`stat-card stat-card-${card.color}`}>
                <div className="stat-icon-label">{card.icon}</div>
                <div className="stat-info">
                  <div className="stat-value">{card.value}</div>
                  <div className="stat-label">{card.label}</div>
                  <div className="stat-sub">{card.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="dashboard-grid">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Recent Activity</h3>
                <span className="badge">{recentActivity.length}</span>
              </div>
              <div className="card-body">
                {recentActivity.length === 0 ? (
                  <div className="empty-state">
                    <p>No recent activity yet. Start by adding contacts or recruits!</p>
                  </div>
                ) : (
                  <div className="activity-list">
                    {recentActivity.map((a) => (
                      <div key={a.id} className="activity-item">
                        <div className="activity-dot"></div>
                        <div>
                          <p className="activity-text">{a.description}</p>
                          <span className="activity-time">{new Date(a.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3 className="card-title">Production Goal</h3></div>
              <div className="card-body">
                <div className="goal-section">
                  <div className="goal-labels">
                    <span>Biz to Biz Qualifier</span>
                    <span className="goal-amount">{fmt(stats.production)} / $50,000</span>
                  </div>
                  <div className="progress-bar-wrap">
                    <div className="progress-bar-fill" style={{ width: `${Math.min((stats.production / 50000) * 100, 100)}%` }}></div>
                  </div>
                  <p className="goal-remaining">
                    {stats.production >= 50000 ? "Goal achieved! Congratulations!" : `${fmt(50000 - stats.production)} remaining to qualify`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
