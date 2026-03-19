import React, { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { fmt, OVERRIDE_RATE, PERSONAL_RATE, CASHFLOW_GOAL, MetricCard, Card, CardHeader, ProgressBar, pct, Badge } from "./components";

export default function DirectorOverview({ profile }) {
  const [agents, setAgents] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);
  const [teamProd, setTeamProd] = useState([]);
  const [myLeads, setMyLeads] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, [profile.id]);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: agts }, { data: ml }, { data: prod }, { data: act }] = await Promise.all([
      supabase.from("profiles").select("id,full_name,email,created_at").eq("director_id", profile.id),
      supabase.from("leads").select("*").eq("user_id", profile.id),
      supabase.from("production").select("*, agent:profiles!production_agent_id_fkey(full_name,email)").eq("director_id", profile.id),
      supabase.from("activity").select("*, user:profiles!activity_user_id_fkey(full_name,email)").in("user_id", [profile.id]),
    ]);
    setAgents(agts || []);
    setMyLeads(ml || []);
    setTeamProd(prod || []);
    setActivity(act || []);

    if ((agts || []).length > 0) {
      const agentIds = agts.map(a => a.id);
      const [{ data: tl }, { data: ta }] = await Promise.all([
        supabase.from("leads").select("*, agent:profiles!leads_user_id_fkey(full_name)").in("user_id", agentIds),
        supabase.from("activity").select("*, user:profiles!activity_user_id_fkey(full_name,email)").in("user_id", agentIds),
      ]);
      setTeamLeads(tl || []);
      setActivity([...(act || []), ...(ta || [])]);
    }
    setLoading(false);
  };

  const personalClosedAP = myLeads.filter(l => l.status === "closed").reduce((s, l) => s + (parseFloat(l.ap) || 0), 0);
  const teamTotalAP = teamProd.reduce((s, e) => s + (parseFloat(e.ap) || 0), 0);
  const personalEarned = personalClosedAP * PERSONAL_RATE;
  const overrideEarned = teamTotalAP * OVERRIDE_RATE;
  const totalEarned = personalEarned + overrideEarned;

  const recentClosures = [...myLeads, ...teamLeads]
    .filter(l => l.status === "closed")
    .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
    .slice(0, 5);

  if (loading) return <div style={{ padding: 40, color: "#bbb", fontSize: 14 }}>Loading your overview...</div>;

  return (
    <div>
      {/* Top metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12, marginBottom: 20 }}>
        <MetricCard label="Team agents" value={agents.length} sub="in your downline" />
        <MetricCard label="Personal AP closed" value={fmt(personalClosedAP)} sub={fmt(personalEarned) + " earned at 75%"} accent="#1D9E75" />
        <MetricCard label="Team AP logged" value={fmt(teamTotalAP)} sub={fmt(overrideEarned) + " override at 25%"} accent="#378ADD" />
        <MetricCard label="Total cashflow" value={fmt(totalEarned)} sub={pct(totalEarned, CASHFLOW_GOAL) + "% of $50k goal"} accent="#7F77DD" />
      </div>

      {/* Progress bars */}
      <Card>
        <CardHeader title="Acquisition progress — $50k cashflow goal" />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { label: "Personal production", val: personalEarned, color: "#1D9E75" },
            { label: "Override income (25%)", val: overrideEarned, color: "#378ADD" },
            { label: "Combined total toward goal", val: totalEarned, color: "#7F77DD" },
          ].map(b => (
            <div key={b.label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 13, color: "#555" }}>{b.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: b.color }}>{fmt(b.val)}</span>
              </div>
              <ProgressBar value={b.val} max={CASHFLOW_GOAL} color={b.color} height={8} />
              <div style={{ fontSize: 11, color: "#bbb", marginTop: 3 }}>{pct(b.val, CASHFLOW_GOAL)}% of $50k goal</div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Agent roster */}
        <Card style={{ marginBottom: 0 }}>
          <CardHeader title="Agent roster" />
          {agents.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
              <div style={{ fontSize: 14, color: "#999" }}>No agents yet</div>
              <div style={{ fontSize: 12, color: "#bbb", marginTop: 4 }}>Invite recruits to sign up — they'll link to your team</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {agents.map(a => {
                const agentLeads = teamLeads.filter(l => l.user_id === a.id);
                const agentAP = agentLeads.filter(l => l.status === "closed").reduce((s, l) => s + (parseFloat(l.ap) || 0), 0);
                return (
                  <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#f8f7f4", borderRadius: 9 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{a.full_name || a.email}</div>
                      <div style={{ fontSize: 11, color: "#aaa" }}>{agentLeads.length} leads · {agentLeads.filter(l => l.status === "closed").length} closed</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1D9E75" }}>{fmt(agentAP)}</div>
                      <div style={{ fontSize: 11, color: "#aaa" }}>AP · {fmt(agentAP * OVERRIDE_RATE)} override</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Recent closures */}
        <Card style={{ marginBottom: 0 }}>
          <CardHeader title="Recent closures" />
          {recentClosures.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
              <div style={{ fontSize: 14, color: "#999" }}>No closed cases yet</div>
              <div style={{ fontSize: 12, color: "#bbb", marginTop: 4 }}>Close your first case and it'll appear here</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {recentClosures.map(l => (
                <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0ede6" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{l.name || "Unnamed"}</div>
                    <div style={{ fontSize: 11, color: "#aaa" }}>{l.product} · {l.source}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1D9E75" }}>{fmt(l.ap)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Team activity this week */}
      <Card>
        <CardHeader title="Team activity this week" />
        {activity.length === 0 ? (
          <div style={{ fontSize: 13, color: "#bbb" }}>No activity logged yet this week.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Agent", "Reach-outs", "Appts set", "Appts held", "Apps", "Field trains", "Recruiting convos"].map(h => (
                    <th key={h} style={{ textAlign: "left", fontSize: 10, fontWeight: 700, color: "#aaa", padding: "0 10px 10px", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activity.map(a => (
                  <tr key={a.id}>
                    <td style={{ padding: "8px 10px", borderTop: "1px solid #f0ede6", fontSize: 13, fontWeight: 600 }}>{a.user?.full_name || a.user?.email || "You"}</td>
                    {["reach_outs", "appts_set", "appts_held", "apps_submitted", "field_trainings", "recruiting_convos"].map(k => (
                      <td key={k} style={{ padding: "8px 10px", borderTop: "1px solid #f0ede6", fontSize: 13, fontFamily: "DM Mono, monospace", color: (a[k] || 0) > 0 ? "#1a1a1a" : "#ccc" }}>
                        {a[k] || 0}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
