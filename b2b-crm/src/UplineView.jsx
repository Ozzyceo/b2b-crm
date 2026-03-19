import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function UplineView({ user, profile }) {
  const [downline, setDownline] = useState([]);
  const [production, setProduction] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const { data: agents } = await supabase.from("profiles").select("*").eq("upline_id", user.id);
    const agentIds = (agents || []).map((a) => a.id);

    let prod = [];
    if (agentIds.length > 0) {
      const { data } = await supabase.from("production").select("*, profiles(full_name)").in("agent_id", agentIds);
      prod = data || [];
    }

    setDownline(agents || []);
    setProduction(prod);
    setLoading(false);
  };

  const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);
  const totalPremium = production.reduce((sum, r) => sum + (r.premium || 0), 0);
  const override = profile?.override_level || 25;
  const overrideEarnings = totalPremium * (override / 100);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">Upline View</h2>
          <p className="page-subtitle">Overview of your downline agents and their production</p>
        </div>
        <div className="badge badge-purple">Upline / Director</div>
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner"></div><p>Loading downline data...</p></div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card stat-card-blue">
              <div className="stat-info">
                <div className="stat-value">{downline.length}</div>
                <div className="stat-label">Direct Downline</div>
                <div className="stat-sub">agents in your team</div>
              </div>
            </div>
            <div className="stat-card stat-card-green">
              <div className="stat-info">
                <div className="stat-value">{fmt(totalPremium)}</div>
                <div className="stat-label">Team Production</div>
                <div className="stat-sub">total written premium</div>
              </div>
            </div>
            <div className="stat-card stat-card-purple">
              <div className="stat-info">
                <div className="stat-value">{fmt(overrideEarnings)}</div>
                <div className="stat-label">Override Earnings</div>
                <div className="stat-sub">{override}% override rate</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Downline Agents</h3>
              <span className="badge">{downline.length}</span>
            </div>
            <div className="card-body">
              {downline.length === 0 ? (
                <div className="empty-state"><p>No downline agents yet. Invite agents to join your team!</p></div>
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr><th>Name</th><th>Email</th><th>Role</th><th>Contract</th><th>Production</th></tr>
                    </thead>
                    <tbody>
                      {downline.map((agent) => {
                        const agentProd = production.filter((p) => p.agent_id === agent.id);
                        const agentTotal = agentProd.reduce((sum, p) => sum + (p.premium || 0), 0);
                        return (
                          <tr key={agent.id}>
                            <td className="contact-name">{agent.full_name}</td>
                            <td>{agent.email}</td>
                            <td><span className={`badge badge-${agent.role === "director" ? "green" : "blue"}`}>{agent.role}</span></td>
                            <td>{agent.contract_level ? agent.contract_level + "%" : "-"}</td>
                            <td className="mono">{fmt(agentTotal)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ marginTop: "1.5rem" }}>
            <div className="card-header">
              <h3 className="card-title">Team Production Records</h3>
              <span className="badge">{production.length}</span>
            </div>
            <div className="card-body">
              {production.length === 0 ? (
                <div className="empty-state"><p>No production records from your downline yet.</p></div>
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr><th>Agent</th><th>Client</th><th>Product</th><th>Premium</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {production.map((p) => (
                        <tr key={p.id}>
                          <td>{p.profiles?.full_name || "-"}</td>
                          <td>{p.client_name}</td>
                          <td><span className="badge badge-blue">{p.product_type}</span></td>
                          <td className="mono">{fmt(p.premium)}</td>
                          <td><span className={`badge badge-${p.status === "Issued" ? "green" : p.status === "Declined" ? "red" : "orange"}`}>{p.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
