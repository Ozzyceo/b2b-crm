import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";

function AgentCard({ agent, depth = 0, allProfiles }) {
  const [expanded, setExpanded] = useState(true);
  const children = allProfiles.filter((p) => p.upline_id === agent.id);

  return (
    <div className="org-node" style={{ marginLeft: depth > 0 ? `${depth * 24}px` : "0" }}>
      <div className="org-card">
        <div className="org-card-info">
          <div className="org-avatar">{(agent.full_name || "?")[0].toUpperCase()}</div>
          <div>
            <div className="org-name">{agent.full_name || "Unknown"}</div>
            <div className="org-meta">
              <span className={`badge badge-${agent.role === "director" ? "green" : agent.role === "upline" ? "purple" : "blue"}`}>{agent.role}</span>
              {agent.contract_level && <span className="org-contract">{agent.contract_level}%</span>}
            </div>
          </div>
        </div>
        {children.length > 0 && (
          <button className="org-expand" onClick={() => setExpanded(!expanded)}>
            {expanded ? "-" : "+"}({children.length})
          </button>
        )}
      </div>
      {expanded && children.length > 0 && (
        <div className="org-children">
          {children.map((child) => (
            <AgentCard key={child.id} agent={child} depth={depth + 1} allProfiles={allProfiles} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrgChart({ user, profile }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchOrg(); }, [user]);

  const fetchOrg = async () => {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("id, full_name, email, role, contract_level, override_level, upline_id");
    setProfiles(data || []);
    setLoading(false);
  };

  const rootProfile = profiles.find((p) => p.id === user.id) || profile;
  const teamCount = profiles.filter((p) => p.upline_id === user.id).length;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">My Organization</h2>
          <p className="page-subtitle">{teamCount} direct team members</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner"></div><p>Loading organization...</p></div>
      ) : (
        <>
          <div className="org-legend">
            <span className="badge badge-green">Director</span>
            <span className="badge badge-purple">Upline/Manager</span>
            <span className="badge badge-blue">Agent</span>
          </div>

          <div className="org-tree">
            {rootProfile ? (
              <AgentCard agent={rootProfile} depth={0} allProfiles={profiles} />
            ) : (
              <div className="empty-state"><p>No organization data found.</p></div>
            )}
          </div>

          <div className="card" style={{ marginTop: "2rem" }}>
            <div className="card-header"><h3 className="card-title">All Team Members</h3></div>
            <div className="card-body">
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Role</th><th>Contract</th><th>Override</th></tr>
                  </thead>
                  <tbody>
                    {profiles.filter((p) => p.upline_id === user.id || p.id === user.id).map((p) => (
                      <tr key={p.id}>
                        <td className="contact-name">{p.full_name}</td>
                        <td>{p.email}</td>
                        <td><span className={`badge badge-${p.role === "director" ? "green" : p.role === "upline" ? "purple" : "blue"}`}>{p.role}</span></td>
                        <td>{p.contract_level ? p.contract_level + "%" : "-"}</td>
                        <td>{p.override_level ? p.override_level + "%" : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
