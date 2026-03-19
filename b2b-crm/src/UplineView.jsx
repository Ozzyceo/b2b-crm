import React, { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { fmt, OVERRIDE_RATE, PERSONAL_RATE, MetricCard, Card, CardHeader, ProgressBar, pct, CASHFLOW_GOAL } from "./components";

export default function UplineView() {
  const [directors, setDirectors] = useState([]);
  const [allLeads, setAllLeads] = useState([]);
  const [allProd, setAllProd] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: dirs }, { data: leads }, { data: prod }] = await Promise.all([
      supabase.from("profiles").select("*").eq("role", "director"),
      supabase.from("leads").select("*, agent:profiles!leads_user_id_fkey(full_name,role)"),
      supabase.from("production").select("*, agent:profiles!production_agent_id_fkey(full_name)"),
    ]);
    setDirectors(dirs || []);
    setAllLeads(leads || []);
    setAllProd(prod || []);
    setLoading(false);
  };

  const totalAP = allLeads.filter(l => l.status === "closed").reduce((s, l) => s + (parseFloat(l.ap) || 0), 0);
  const totalTeamAP = allProd.reduce((s, e) => s + (parseFloat(e.ap) || 0), 0);

  if (loading) return <div style={{ padding: 40, color: "#bbb" }}>Loading org view...</div>;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12, marginBottom: 20 }}>
        <MetricCard label="Total directors" value={directors.length} />
        <MetricCard label="Org personal AP" value={fmt(totalAP)} accent="#1D9E75" />
        <MetricCard label="Org team AP logged" value={fmt(totalTeamAP)} accent="#378ADD" />
        <MetricCard label="Total org cases closed" value={allLeads.filter(l => l.status === "closed").length} accent="#7F77DD" />
      </div>

      <Card>
        <CardHeader title="Director breakdown" />
        {directors.length === 0 ? (
          <div style={{ textAlign: "center", padding: 32, color: "#bbb", fontSize: 14 }}>No directors in the system yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {directors.map(d => {
              const dirLeads = allLeads.filter(l => l.user_id === d.id);
              const dirClosedAP = dirLeads.filter(l => l.status === "closed").reduce((s, l) => s + (parseFloat(l.ap) || 0), 0);
              const dirTeamAP = allProd.filter(e => e.director_id === d.id).reduce((s, e) => s + (parseFloat(e.ap) || 0), 0);
              const totalEarned = dirClosedAP * PERSONAL_RATE + dirTeamAP * OVERRIDE_RATE;
              return (
                <div key={d.id} style={{ background: "#f8f7f4", borderRadius: 12, padding: "16px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{d.full_name || d.email}</div>
                      <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{d.email}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#1D9E75" }}>{fmt(totalEarned)}</div>
                      <div style={{ fontSize: 11, color: "#aaa" }}>total cashflow</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10, marginBottom: 12 }}>
                    <div style={{ background: "#fff", borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ fontSize: 11, color: "#aaa" }}>Personal AP</div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{fmt(dirClosedAP)}</div>
                    </div>
                    <div style={{ background: "#fff", borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ fontSize: 11, color: "#aaa" }}>Team AP</div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{fmt(dirTeamAP)}</div>
                    </div>
                    <div style={{ background: "#fff", borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ fontSize: 11, color: "#aaa" }}>Leads</div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{dirLeads.length}</div>
                    </div>
                  </div>
                  <ProgressBar value={totalEarned} max={CASHFLOW_GOAL} color="#1D9E75" height={6} />
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>{pct(totalEarned, CASHFLOW_GOAL)}% of $50k acquisition goal</div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="All recent closed cases" />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Agent", "Client", "Product", "AP", "Source"].map(h => (
                  <th key={h} style={{ textAlign: "left", fontSize: 10, fontWeight: 700, color: "#aaa", padding: "0 10px 10px", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allLeads.filter(l => l.status === "closed").slice(0, 20).map(l => (
                <tr key={l.id}>
                  <td style={{ padding: "8px 10px", borderTop: "1px solid #f0ede6", fontSize: 12, color: "#888" }}>{l.agent?.full_name || "—"}</td>
                  <td style={{ padding: "8px 10px", borderTop: "1px solid #f0ede6", fontSize: 13, fontWeight: 600 }}>{l.name || "—"}</td>
                  <td style={{ padding: "8px 10px", borderTop: "1px solid #f0ede6", fontSize: 13 }}>{l.product}</td>
                  <td style={{ padding: "8px 10px", borderTop: "1px solid #f0ede6", fontSize: 13, fontWeight: 700, color: "#1D9E75" }}>{fmt(l.ap)}</td>
                  <td style={{ padding: "8px 10px", borderTop: "1px solid #f0ede6", fontSize: 12, color: "#888" }}>{l.source}</td>
                </tr>
              ))}
              {allLeads.filter(l => l.status === "closed").length === 0 && (
                <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", fontSize: 13, color: "#bbb" }}>No closed cases yet across the org.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
