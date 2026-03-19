import React, { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { fmt, PERSONAL_RATE, MetricCard, Card, CardHeader, AddBtn, Th, Td, Input, Select, DelBtn, EmptyRow, Badge } from "./components";

const SOURCES = ["Warm market", "Referral", "Partner", "Field training", "Cold outreach", "Other"];
const PRODUCTS = ["IUL", "Term", "IUL + Term", "Annuity", "Other"];
const STATUSES = [
  { value: "new", label: "New" },
  { value: "appt", label: "Appt set" },
  { value: "app", label: "App submitted" },
  { value: "closed", label: "Closed" },
  { value: "lost", label: "Lost" },
];

export default function LeadsTab({ userId, readOnly = false }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => { fetch(); }, [userId]);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("leads").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    setLeads(data || []);
    setLoading(false);
  };

  const add = async () => {
    const { data } = await supabase.from("leads").insert({ user_id: userId, name: "", source: "Warm market", product: "IUL", status: "new", ap: 0, referred_by: "", next_action: "" }).select();
    if (data) setLeads([data[0], ...leads]);
  };

  const update = async (id, field, value) => {
    setLeads(leads.map(l => l.id === id ? { ...l, [field]: value } : l));
    await supabase.from("leads").update({ [field]: value, updated_at: new Date().toISOString() }).eq("id", id);
  };

  const remove = async (id) => {
    if (!confirm("Delete this lead?")) return;
    setLeads(leads.filter(l => l.id !== id));
    await supabase.from("leads").delete().eq("id", id);
  };

  const closedAP = leads.filter(l => l.status === "closed").reduce((s, l) => s + (parseFloat(l.ap) || 0), 0);
  const filtered = filter === "all" ? leads : leads.filter(l => l.status === filter);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12, marginBottom: 20 }}>
        <MetricCard label="Total leads" value={leads.length} />
        <MetricCard label="Active appts" value={leads.filter(l => l.status === "appt" || l.status === "app").length} accent="#378ADD" />
        <MetricCard label="Closed cases" value={leads.filter(l => l.status === "closed").length} accent="#1D9E75" />
        <MetricCard label="AP closed" value={fmt(closedAP)} sub={fmt(closedAP * PERSONAL_RATE) + " earned at 75%"} accent="#1D9E75" />
      </div>

      <Card>
        <CardHeader title="Lead tracker"
          action={
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select value={filter} onChange={e => setFilter(e.target.value)}
                style={{ fontSize: 12, padding: "4px 8px", border: "1px solid #e0ddd6", borderRadius: 6, color: "#555", outline: "none" }}>
                <option value="all">All statuses</option>
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              {!readOnly && <AddBtn onClick={add} label="+ Add lead" />}
            </div>
          }
        />
        {loading ? <p style={{ color: "#bbb", fontSize: 13 }}>Loading...</p> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <Th w="18%">Name</Th>
                  <Th w="14%">Source</Th>
                  <Th w="12%">Product</Th>
                  <Th w="11%">Status</Th>
                  <Th w="9%">AP ($)</Th>
                  <Th w="13%">Referred by</Th>
                  <Th w="18%">Next action</Th>
                  <Th w="5%"></Th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <EmptyRow cols={8} message="No leads yet — add your first one!" />}
                {filtered.map(l => (
                  <tr key={l.id}>
                    <Td><Input value={l.name} disabled={readOnly} onChange={e => update(l.id, "name", e.target.value)} placeholder="Full name" /></Td>
                    <Td><Select value={l.source} disabled={readOnly} options={SOURCES} onChange={e => update(l.id, "source", e.target.value)} /></Td>
                    <Td><Select value={l.product} disabled={readOnly} options={PRODUCTS} onChange={e => update(l.id, "product", e.target.value)} /></Td>
                    <Td>
                      {readOnly ? <Badge status={l.status} /> :
                        <Select value={l.status} options={STATUSES} onChange={e => update(l.id, "status", e.target.value)} />}
                    </Td>
                    <Td><Input value={l.ap} disabled={readOnly} type="number" onChange={e => update(l.id, "ap", parseFloat(e.target.value) || 0)} placeholder="0" style={{ width: 80 }} /></Td>
                    <Td><Input value={l.referred_by} disabled={readOnly} onChange={e => update(l.id, "referred_by", e.target.value)} placeholder="Who referred?" /></Td>
                    <Td><Input value={l.next_action} disabled={readOnly} onChange={e => update(l.id, "next_action", e.target.value)} placeholder="e.g. Follow up Friday" /></Td>
                    <Td>{!readOnly && <DelBtn onClick={() => remove(l.id)} />}</Td>
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
