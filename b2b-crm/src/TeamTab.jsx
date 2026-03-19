import React, { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { fmt, OVERRIDE_RATE, PERSONAL_RATE, MetricCard, Card, CardHeader, AddBtn, Th, Td, Input, Select, DelBtn, EmptyRow, ProgressBar, pct } from "./components";

const PRODUCTS = ["IUL", "Term", "IUL + Term", "Annuity", "Other"];
const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(); d.setMonth(d.getMonth() - i);
  return d.toISOString().slice(0, 7);
});

export default function TeamTab({ directorId }) {
  const [entries, setEntries] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => { fetchAll(); }, [directorId]);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: prod }, { data: agts }] = await Promise.all([
      supabase.from("production").select("*, agent:profiles!production_agent_id_fkey(full_name,email)").eq("director_id", directorId).order("created_at", { ascending: false }),
      supabase.from("profiles").select("id,full_name,email").eq("director_id", directorId),
    ]);
    setEntries(prod || []);
    setAgents(agts || []);
    setLoading(false);
  };

  const add = async () => {
    const agentId = agents[0]?.id;
    if (!agentId) return alert("No agents on your team yet. Have them sign up and you'll assign them to your team.");
    const { data } = await supabase.from("production").insert({ agent_id: agentId, director_id: directorId, month_year: month, ap: 0, policies: 0, product: "IUL", notes: "" }).select("*, agent:profiles!production_agent_id_fkey(full_name,email)");
    if (data) setEntries([data[0], ...entries]);
  };

  const update = async (id, field, value) => {
    setEntries(entries.map(e => e.id === id ? { ...e, [field]: value } : e));
    await supabase.from("production").update({ [field]: value }).eq("id", id);
  };

  const remove = async (id) => {
    if (!confirm("Delete this entry?")) return;
    setEntries(entries.filter(e => e.id !== id));
    await supabase.from("production").delete().eq("id", id);
  };

  const filtered = entries.filter(e => e.month_year === month);
  const totalAP = entries.reduce((s, e) => s + (parseFloat(e.ap) || 0), 0);
  const monthAP = filtered.reduce((s, e) => s + (parseFloat(e.ap) || 0), 0);
  const totalOverride = totalAP * OVERRIDE_RATE;
  const monthOverride = monthAP * OVERRIDE_RATE;

  const CASHFLOW_GOAL = 50000;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12, marginBottom: 20 }}>
        <MetricCard label="Team agents" value={agents.length} />
        <MetricCard label="This month team AP" value={fmt(monthAP)} sub={`Override: ${fmt(monthOverride)}`} accent="#378ADD" />
        <MetricCard label="All-time team AP" value={fmt(totalAP)} accent="#1D9E75" />
        <MetricCard label="Total override earned" value={fmt(totalOverride)} sub="at 25% override rate" accent="#1D9E75" />
      </div>

      {/* Override progress */}
      <Card>
        <CardHeader title="Override income toward $50k goal" />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: "#555" }}>Override income</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1D9E75" }}>{fmt(totalOverride)} / {fmt(CASHFLOW_GOAL)}</span>
            </div>
            <ProgressBar value={totalOverride} max={CASHFLOW_GOAL} color="#1D9E75" height={10} />
            <div style={{ fontSize: 11, color: "#bbb", marginTop: 4 }}>{pct(totalOverride, CASHFLOW_GOAL)}% of $50k goal from overrides alone</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>
            {[
              { label: "5 agents @ $3k/mo AP", val: 5 * 3000 * 12 * OVERRIDE_RATE },
              { label: "7 agents @ $4k/mo AP", val: 7 * 4000 * 12 * OVERRIDE_RATE },
              { label: "10 agents @ $5k/mo AP", val: 10 * 5000 * 12 * OVERRIDE_RATE },
            ].map(s => (
              <div key={s.label} style={{ background: "#f8f7f4", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "#999", marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1D9E75" }}>{fmt(s.val)}/yr</div>
                <div style={{ fontSize: 11, color: "#bbb" }}>override @ 25%</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Team production log"
          action={
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select value={month} onChange={e => setMonth(e.target.value)}
                style={{ fontSize: 12, padding: "4px 8px", border: "1px solid #e0ddd6", borderRadius: 6, outline: "none" }}>
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <AddBtn onClick={add} label="+ Add entry" />
            </div>
          }
        />
        {loading ? <p style={{ color: "#bbb", fontSize: 13 }}>Loading...</p> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <Th w="20%">Agent</Th>
                  <Th w="12%">Month</Th>
                  <Th w="12%">Product</Th>
                  <Th w="10%">AP ($)</Th>
                  <Th w="8%">Policies</Th>
                  <Th w="14%">Your override</Th>
                  <Th w="19%">Notes</Th>
                  <Th w="5%"></Th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <EmptyRow cols={8} message="No production logged for this month yet." />}
                {filtered.map(e => (
                  <tr key={e.id}>
                    <Td>
                      <Select value={e.agent_id} options={agents.map(a => ({ value: a.id, label: a.full_name || a.email }))}
                        onChange={async ev => { update(e.id, "agent_id", ev.target.value); }} />
                    </Td>
                    <Td>
                      <Select value={e.month_year} options={MONTHS.map(m => ({ value: m, label: m }))}
                        onChange={ev => update(e.id, "month_year", ev.target.value)} />
                    </Td>
                    <Td><Select value={e.product} options={PRODUCTS} onChange={ev => update(e.id, "product", ev.target.value)} /></Td>
                    <Td><Input value={e.ap} type="number" onChange={ev => update(e.id, "ap", parseFloat(ev.target.value) || 0)} style={{ width: 90 }} /></Td>
                    <Td><Input value={e.policies} type="number" onChange={ev => update(e.id, "policies", parseInt(ev.target.value) || 0)} style={{ width: 60 }} /></Td>
                    <Td style={{ fontWeight: 700, color: "#1D9E75" }}>{fmt((parseFloat(e.ap) || 0) * OVERRIDE_RATE)}</Td>
                    <Td><Input value={e.notes} onChange={ev => update(e.id, "notes", ev.target.value)} placeholder="Notes..." /></Td>
                    <Td><DelBtn onClick={() => remove(e.id)} /></Td>
                  </tr>
                ))}
                {filtered.length > 0 && (
                  <tr style={{ background: "#f8f7f4" }}>
                    <Td style={{ fontWeight: 700 }}>Month totals</Td>
                    <Td /><Td />
                    <Td style={{ fontWeight: 700 }}>{fmt(monthAP)}</Td>
                    <Td style={{ fontWeight: 700 }}>{filtered.reduce((s, e) => s + (parseInt(e.policies) || 0), 0)}</Td>
                    <Td style={{ fontWeight: 700, color: "#1D9E75" }}>{fmt(monthOverride)}</Td>
                    <Td /><Td />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
