import React, { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { MetricCard, Card, CardHeader, AddBtn, Th, Td, Input, Select, DelBtn, EmptyRow, Badge } from "./components";

const STATUSES = [
  { value: "prospect", label: "Prospect" },
  { value: "presented", label: "Presented" },
  { value: "licensed", label: "Getting licensed" },
  { value: "active", label: "Active agent" },
  { value: "inactive", label: "Dropped off" },
];
const LICENSE = ["Not started", "Studying", "Exam scheduled", "Licensed"];
const TRAINING = ["In person", "3-way calls", "Both", "Remote only"];

export default function RecruitsTab({ userId, readOnly = false }) {
  const [recruits, setRecruits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch(); }, [userId]);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("recruits").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    setRecruits(data || []);
    setLoading(false);
  };

  const add = async () => {
    const { data } = await supabase.from("recruits").insert({ user_id: userId, name: "", warm_market_size: 0, status: "prospect", license_status: "Not started", training_method: "Both", next_step: "" }).select();
    if (data) setRecruits([data[0], ...recruits]);
  };

  const update = async (id, field, value) => {
    setRecruits(recruits.map(r => r.id === id ? { ...r, [field]: value } : r));
    await supabase.from("recruits").update({ [field]: value, updated_at: new Date().toISOString() }).eq("id", id);
  };

  const remove = async (id) => {
    if (!confirm("Delete this recruit?")) return;
    setRecruits(recruits.filter(r => r.id !== id));
    await supabase.from("recruits").delete().eq("id", id);
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12, marginBottom: 20 }}>
        <MetricCard label="Total prospects" value={recruits.length} />
        <MetricCard label="Presented" value={recruits.filter(r => r.status === "presented").length} accent="#BA7517" />
        <MetricCard label="Getting licensed" value={recruits.filter(r => r.status === "licensed").length} accent="#533AB7" />
        <MetricCard label="Active agents" value={recruits.filter(r => r.status === "active").length} accent="#1D9E75" />
      </div>

      <Card>
        <CardHeader title="Recruit pipeline" action={!readOnly && <AddBtn onClick={add} label="+ Add recruit" />} />
        {loading ? <p style={{ color: "#bbb", fontSize: 13 }}>Loading...</p> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <Th w="18%">Name</Th>
                  <Th w="10%">Warm market</Th>
                  <Th w="14%">Status</Th>
                  <Th w="14%">License</Th>
                  <Th w="13%">Training</Th>
                  <Th w="26%">Next step</Th>
                  <Th w="5%"></Th>
                </tr>
              </thead>
              <tbody>
                {recruits.length === 0 && <EmptyRow cols={7} message="No recruits yet — start building your team!" />}
                {recruits.map(r => (
                  <tr key={r.id}>
                    <Td><Input value={r.name} disabled={readOnly} onChange={e => update(r.id, "name", e.target.value)} placeholder="Full name" /></Td>
                    <Td>
                      <Input value={r.warm_market_size} disabled={readOnly} type="number"
                        onChange={e => update(r.id, "warm_market_size", parseInt(e.target.value) || 0)}
                        placeholder="# contacts" style={{ width: 80 }} />
                    </Td>
                    <Td>
                      {readOnly ? <Badge status={r.status} /> :
                        <Select value={r.status} options={STATUSES} onChange={e => update(r.id, "status", e.target.value)} />}
                    </Td>
                    <Td><Select value={r.license_status} disabled={readOnly} options={LICENSE} onChange={e => update(r.id, "license_status", e.target.value)} /></Td>
                    <Td><Select value={r.training_method} disabled={readOnly} options={TRAINING} onChange={e => update(r.id, "training_method", e.target.value)} /></Td>
                    <Td><Input value={r.next_step} disabled={readOnly} onChange={e => update(r.id, "next_step", e.target.value)} placeholder="Next step..." /></Td>
                    <Td>{!readOnly && <DelBtn onClick={() => remove(r.id)} />}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Field training tips" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12 }}>
          {[
            { step: "01", title: "Build the list", body: "Sit down with your recruit and build their 50-person warm market list together on day 1." },
            { step: "02", title: "Role play scripts", body: "Practice the appointment-setting script until it's natural before they dial anyone." },
            { step: "03", title: "Dial together", body: "Sit with them for their first dial session. Coach in real time. Appointments get set together." },
            { step: "04", title: "Run appointments", body: "You present, they assist. Every close = your AP + builds your override income stream." },
            { step: "05", title: "Flip the roles", body: "Week 3-4: they present, you support. This is when override income becomes truly passive." },
            { step: "06", title: "Ask for referrals", body: "Their warm market = your pipeline too. Ask every contact for referrals as you go." },
          ].map(t => (
            <div key={t.step} style={{ background: "#f8f7f4", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#1D9E75", letterSpacing: "0.1em", marginBottom: 6 }}>STEP {t.step}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 6 }}>{t.title}</div>
              <div style={{ fontSize: 12, color: "#777", lineHeight: 1.6 }}>{t.body}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
