import React, { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { fmt, MetricCard, Card, CardHeader, AddBtn, Th, Td, Input, Select, DelBtn, EmptyRow, GoalRow, ProgressBar, OVERRIDE_RATE, PERSONAL_RATE, CASHFLOW_GOAL, AP_GOAL, pct } from "./components";

const PARTNER_TYPES = ["CPA / Accountant", "Bookkeeper", "Mortgage broker", "Real estate agent", "Banker", "HR consultant", "Payroll company", "Barber / salon", "Church / community", "Other"];
const REFERRAL_FEE = 250;

export function PartnersTab({ userId, readOnly = false }) {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch(); }, [userId]);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("partners").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    setPartners(data || []);
    setLoading(false);
  };

  const add = async () => {
    const { data } = await supabase.from("partners").insert({ user_id: userId, name: "", partner_type: "CPA / Accountant", contact: "", leads_sent: 0, converted: 0 }).select();
    if (data) setPartners([data[0], ...partners]);
  };

  const update = async (id, field, value) => {
    setPartners(partners.map(p => p.id === id ? { ...p, [field]: value } : p));
    await supabase.from("partners").update({ [field]: value }).eq("id", id);
  };

  const remove = async (id) => {
    if (!confirm("Remove this partner?")) return;
    setPartners(partners.filter(p => p.id !== id));
    await supabase.from("partners").delete().eq("id", id);
  };

  const totalFees = partners.reduce((s, p) => s + ((p.converted || 0) * REFERRAL_FEE), 0);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12, marginBottom: 20 }}>
        <MetricCard label="Total partners" value={partners.length} />
        <MetricCard label="Leads received" value={partners.reduce((s, p) => s + (p.leads_sent || 0), 0)} accent="#378ADD" />
        <MetricCard label="Total conversions" value={partners.reduce((s, p) => s + (p.converted || 0), 0)} accent="#1D9E75" />
        <MetricCard label="Referral fees owed" value={fmt(totalFees)} sub={`$${REFERRAL_FEE} per conversion`} accent="#BA7517" />
      </div>

      <Card>
        <CardHeader title="Referral partner tracker" action={!readOnly && <AddBtn onClick={add} label="+ Add partner" />} />
        {loading ? <p style={{ color: "#bbb", fontSize: 13 }}>Loading...</p> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <Th w="18%">Name</Th>
                  <Th w="18%">Type</Th>
                  <Th w="18%">Contact</Th>
                  <Th w="9%">Leads sent</Th>
                  <Th w="9%">Converted</Th>
                  <Th w="13%">Fees owed</Th>
                  <Th w="10%">Last contact</Th>
                  <Th w="5%"></Th>
                </tr>
              </thead>
              <tbody>
                {partners.length === 0 && <EmptyRow cols={8} message="No referral partners yet — visit 5 new ones this week!" />}
                {partners.map(p => (
                  <tr key={p.id}>
                    <Td><Input value={p.name} disabled={readOnly} onChange={e => update(p.id, "name", e.target.value)} placeholder="Partner name" /></Td>
                    <Td><Select value={p.partner_type} disabled={readOnly} options={PARTNER_TYPES} onChange={e => update(p.id, "partner_type", e.target.value)} /></Td>
                    <Td><Input value={p.contact} disabled={readOnly} onChange={e => update(p.id, "contact", e.target.value)} placeholder="Phone or email" /></Td>
                    <Td><Input value={p.leads_sent} disabled={readOnly} type="number" onChange={e => update(p.id, "leads_sent", parseInt(e.target.value) || 0)} style={{ width: 60 }} /></Td>
                    <Td><Input value={p.converted} disabled={readOnly} type="number" onChange={e => update(p.id, "converted", parseInt(e.target.value) || 0)} style={{ width: 60 }} /></Td>
                    <Td style={{ fontWeight: 700, color: "#BA7517" }}>{fmt((p.converted || 0) * REFERRAL_FEE)}</Td>
                    <Td><Input value={p.last_contact || ""} disabled={readOnly} type="date" onChange={e => update(p.id, "last_contact", e.target.value)} style={{ width: "100%" }} /></Td>
                    <Td>{!readOnly && <DelBtn onClick={() => remove(p.id)} />}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Partner outreach script" />
        <div style={{ background: "#f8f7f4", borderRadius: 10, padding: "18px 20px", borderLeft: "4px solid #1D9E75" }}>
          <div style={{ fontSize: 12, color: "#999", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>Walk-in script</div>
          <p style={{ fontSize: 14, color: "#333", lineHeight: 1.8, fontStyle: "italic" }}>
            "Hi, I'm [Name], I'm a local financial advisor. I work with families on life insurance and retirement planning. I'm not here to sell you anything — I actually pay people $200-300 cash for referrals that turn into clients. Do you have 5 minutes to hear how it works?"
          </p>
        </div>
      </Card>
    </div>
  );
}

const GOAL_DEFS = [
  { key: "reach_outs", label: "Reach-outs (calls / texts)", target: 20, color: "#378ADD" },
  { key: "recruiting_convos", label: "Recruiting conversations", target: 5, color: "#7F77DD" },
  { key: "appts_set", label: "Client appointments set", target: 3, color: "#1D9E75" },
  { key: "appts_held", label: "Client appointments held", target: 2, color: "#1D9E75" },
  { key: "apps_submitted", label: "Applications submitted", target: 2, color: "#0F6E56" },
  { key: "field_trainings", label: "Field training sessions", target: 3, color: "#BA7517" },
  { key: "referral_asks", label: "Referral asks made", target: 10, color: "#D85A30" },
  { key: "partner_visits", label: "Partner visits", target: 5, color: "#993C1D" },
];

function getMonday() {
  const d = new Date();
  const day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
}

export function GoalsTab({ userId, personalAP = 0, teamAP = 0 }) {
  const [activity, setActivity] = useState({});
  const [loading, setLoading] = useState(true);
  const weekStart = getMonday();

  useEffect(() => { fetch(); }, [userId]);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("activity").select("*").eq("user_id", userId).eq("week_start", weekStart).single();
    setActivity(data || {});
    setLoading(false);
  };

  const update = async (key, value) => {
    const updated = { ...activity, [key]: value };
    setActivity(updated);
    if (activity.id) {
      await supabase.from("activity").update({ [key]: value, updated_at: new Date().toISOString() }).eq("id", activity.id);
    } else {
      const { data } = await supabase.from("activity").insert({ user_id: userId, week_start: weekStart, [key]: value }).select().single();
      if (data) setActivity(data);
    }
  };

  const personalEarned = personalAP * PERSONAL_RATE;
  const overrideEarned = teamAP * OVERRIDE_RATE;
  const totalEarned = personalEarned + overrideEarned;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12, marginBottom: 20 }}>
        <MetricCard label="Personal AP earned" value={fmt(personalEarned)} sub={`from ${fmt(personalAP)} AP at 75%`} accent="#1D9E75" />
        <MetricCard label="Override income" value={fmt(overrideEarned)} sub={`from ${fmt(teamAP)} team AP at 25%`} accent="#378ADD" />
        <MetricCard label="Total cashflow" value={fmt(totalEarned)} accent="#1D9E75" />
        <MetricCard label="Remaining to $50k" value={fmt(Math.max(0, CASHFLOW_GOAL - totalEarned))} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card style={{ marginBottom: 0 }}>
          <CardHeader title={`Week of ${weekStart}`} />
          {loading ? <p style={{ color: "#bbb", fontSize: 13 }}>Loading...</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {GOAL_DEFS.map(g => (
                <GoalRow key={g.key} label={g.label} done={activity[g.key] || 0} target={g.target} color={g.color}
                  onUpdate={v => update(g.key, v)} />
              ))}
            </div>
          )}
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ marginBottom: 0 }}>
            <CardHeader title="Income progress" />
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: "Personal production", val: personalEarned, color: "#1D9E75" },
                { label: "Override income", val: overrideEarned, color: "#378ADD" },
                { label: "Total toward $50k goal", val: totalEarned, color: "#7F77DD" },
              ].map(b => (
                <div key={b.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, color: "#666" }}>{b.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{fmt(b.val)}</span>
                  </div>
                  <ProgressBar value={b.val} max={CASHFLOW_GOAL} color={b.color} height={8} />
                  <div style={{ fontSize: 11, color: "#bbb", marginTop: 3 }}>{pct(b.val, CASHFLOW_GOAL)}% of $50k goal</div>
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ marginBottom: 0 }}>
            <CardHeader title="Daily non-negotiables" />
            {[
              { n: "20", label: "reach-outs every day" },
              { n: "5", label: "new referral partner visits per week" },
              { n: "2–3", label: "applications submitted per week" },
              { n: "Every", label: "conversation ends with a referral ask" },
              { n: "48hrs", label: "max before a new recruit dials their list" },
            ].map(r => (
              <div key={r.n} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid #f0ede6" }}>
                <div style={{ minWidth: 40, fontSize: 14, fontWeight: 700, color: "#1D9E75", fontFamily: "DM Mono, monospace" }}>{r.n}</div>
                <div style={{ fontSize: 13, color: "#555", lineHeight: 1.5 }}>{r.label}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
