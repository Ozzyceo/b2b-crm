import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function ReportsSection({ user, profile }) {
  const [data, setData] = useState({ contacts: [], recruits: [], production: [], events: [] });
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30");

  useEffect(() => { fetchAll(); }, [user, range]);

  const fetchAll = async () => {
    setLoading(true);
    const since = new Date();
    since.setDate(since.getDate() - parseInt(range));
    const sinceStr = since.toISOString();

    const [contacts, recruits, production, events] = await Promise.all([
      supabase.from("contacts").select("*").eq("owner_id", user.id).gte("created_at", sinceStr),
      supabase.from("recruits").select("*").eq("owner_id", user.id).gte("created_at", sinceStr),
      supabase.from("production").select("*").eq("agent_id", user.id).gte("created_at", sinceStr),
      supabase.from("calendar_events").select("*").eq("owner_id", user.id).gte("created_at", sinceStr),
    ]);

    setData({
      contacts: contacts.data || [],
      recruits: recruits.data || [],
      production: production.data || [],
      events: events.data || [],
    });
    setLoading(false);
  };

  const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);

  const totalPremium = data.production.reduce((sum, r) => sum + (r.premium || 0), 0);
  const issuedPremium = data.production.filter((r) => r.status === "Issued").reduce((sum, r) => sum + (r.premium || 0), 0);
  const activeRecruits = data.recruits.filter((r) => r.status === "Active Agent").length;
  const interestedRecruits = data.recruits.filter((r) => ["Contacted", "Interested", "Application Sent"].includes(r.status)).length;

  const productByType = data.production.reduce((acc, r) => {
    acc[r.product_type] = (acc[r.product_type] || 0) + (r.premium || 0);
    return acc;
  }, {});

  const recruitsByStatus = data.recruits.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">Reports & Stats</h2>
          <p className="page-subtitle">Performance overview for the last {range} days</p>
        </div>
        <select className="form-input" style={{ width: "auto" }} value={range} onChange={(e) => setRange(e.target.value)}>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner"></div><p>Loading reports...</p></div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card stat-card-green">
              <div className="stat-info">
                <div className="stat-value">{fmt(totalPremium)}</div>
                <div className="stat-label">Written Premium</div>
                <div className="stat-sub">{data.production.length} policies</div>
              </div>
            </div>
            <div className="stat-card stat-card-purple">
              <div className="stat-info">
                <div className="stat-value">{fmt(issuedPremium)}</div>
                <div className="stat-label">Issued Premium</div>
                <div className="stat-sub">actual cash flow</div>
              </div>
            </div>
            <div className="stat-card stat-card-blue">
              <div className="stat-info">
                <div className="stat-value">{data.contacts.length}</div>
                <div className="stat-label">New Contacts</div>
                <div className="stat-sub">added this period</div>
              </div>
            </div>
            <div className="stat-card stat-card-orange">
              <div className="stat-info">
                <div className="stat-value">{data.recruits.length}</div>
                <div className="stat-label">Recruits</div>
                <div className="stat-sub">{activeRecruits} active agents</div>
              </div>
            </div>
          </div>

          <div className="reports-grid">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Production by Product Type</h3>
              </div>
              <div className="card-body">
                {Object.keys(productByType).length === 0 ? (
                  <p className="empty-text">No production this period.</p>
                ) : (
                  <div className="bar-chart">
                    {Object.entries(productByType).sort((a, b) => b[1] - a[1]).map(([type, amount]) => (
                      <div key={type} className="bar-item">
                        <div className="bar-label">{type}</div>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${(amount / totalPremium) * 100}%` }}></div>
                        </div>
                        <div className="bar-value">{fmt(amount)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Recruit Pipeline</h3>
              </div>
              <div className="card-body">
                {Object.keys(recruitsByStatus).length === 0 ? (
                  <p className="empty-text">No recruits this period.</p>
                ) : (
                  <div className="pipeline-list">
                    {Object.entries(recruitsByStatus).map(([status, count]) => (
                      <div key={status} className="pipeline-item">
                        <span className="pipeline-status">{status}</span>
                        <span className="pipeline-count">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Goal Progress</h3>
              </div>
              <div className="card-body">
                <div className="goal-section">
                  <div className="goal-labels">
                    <span>Biz to Biz: $50K Cashflow</span>
                    <span className="goal-amount">{fmt(issuedPremium)} / $50,000</span>
                  </div>
                  <div className="progress-bar-wrap">
                    <div className="progress-bar-fill" style={{ width: `${Math.min((issuedPremium / 50000) * 100, 100)}%` }}></div>
                  </div>
                  <p className="goal-remaining">
                    {issuedPremium >= 50000 ? "Goal Achieved!" : `${fmt(50000 - issuedPremium)} remaining`}
                  </p>
                </div>
                <div className="goal-section" style={{ marginTop: "1.5rem" }}>
                  <div className="goal-labels">
                    <span>Team Building: 10 Active Agents</span>
                    <span className="goal-amount">{activeRecruits} / 10</span>
                  </div>
                  <div className="progress-bar-wrap">
                    <div className="progress-bar-fill bar-fill-blue" style={{ width: `${Math.min((activeRecruits / 10) * 100, 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
