import React, { useState, useEffect } from "react";
import { supabase } from "./supabase";
import LoginPage from "./LoginPage";
import LeadsTab from "./LeadsTab";
import RecruitsTab from "./RecruitsTab";
import TeamTab from "./TeamTab";
import DirectorOverview from "./DirectorOverview";
import UplineView from "./UplineView";
import { PartnersTab, GoalsTab } from "./OtherTabs";

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (uid) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
    setProfile(data);
    setLoading(false);
    // Set default tab by role
    if (!tab) {
      if (data?.role === "upline") setTab("Org View");
      else if (data?.role === "director") setTab("Overview");
      else setTab("My Leads");
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setTab(null);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0d0f14" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#1D9E75", fontWeight: 700, marginBottom: 12 }}>Biz to Biz CRM</div>
        <div style={{ fontSize: 14, color: "#666" }}>Loading your dashboard...</div>
      </div>
    </div>
  );

  if (!session) return <LoginPage />;
  if (!profile) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f4f0" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 14, color: "#888" }}>Setting up your profile...</div>
        <button onClick={logout} style={{ marginTop: 16, fontSize: 12, color: "#bbb", background: "none", border: "none", cursor: "pointer" }}>Sign out</button>
      </div>
    </div>
  );

  const role = profile.role;

  const TABS = role === "upline"
    ? ["Org View", "All Agents", "All Leads"]
    : role === "director"
    ? ["Overview", "My Leads", "Recruits", "Team", "Partners", "Goals"]
    : ["My Leads", "Recruits", "Partners", "Goals"];

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Nav */}
      <div style={{ background: "#0d0f14", display: "flex", alignItems: "center", padding: "0 24px", height: 54, gap: 4, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 0 rgba(255,255,255,0.05)" }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#1D9E75", marginRight: 20, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          B2B CRM
        </div>
        <div style={{ display: "flex", gap: 2, flex: 1, overflowX: "auto" }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: "6px 14px", background: tab === t ? "#1D9E75" : "transparent", color: tab === t ? "#fff" : "#666", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", fontWeight: tab === t ? 700 : 400, transition: "all .15s" }}>
              {t}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: 12 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{profile.full_name || profile.email}</div>
            <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.07em" }}>{role}</div>
          </div>
          <button onClick={logout} style={{ padding: "4px 10px", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 6, color: "#666", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            Sign out
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "28px 24px" }}>

        {/* Role badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a" }}>
            {tab}
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: role === "upline" ? "#EEEDFE" : role === "director" ? "#E1F5EE" : "#E6F1FB", color: role === "upline" ? "#3C3489" : role === "director" ? "#085041" : "#0C447C", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {role}
          </span>
        </div>

        {/* Upline tabs */}
        {role === "upline" && tab === "Org View" && <UplineView />}
        {role === "upline" && tab === "All Agents" && <AgentsTable />}
        {role === "upline" && tab === "All Leads" && <AllLeadsView />}

        {/* Director tabs */}
        {role === "director" && tab === "Overview" && <DirectorOverview profile={profile} />}
        {role === "director" && tab === "My Leads" && <LeadsTab userId={profile.id} />}
        {role === "director" && tab === "Recruits" && <RecruitsTab userId={profile.id} />}
        {role === "director" && tab === "Team" && <TeamTab directorId={profile.id} />}
        {role === "director" && tab === "Partners" && <PartnersTab userId={profile.id} />}
        {role === "director" && tab === "Goals" && <GoalsTab userId={profile.id} />}

        {/* Agent tabs */}
        {role === "agent" && tab === "My Leads" && <LeadsTab userId={profile.id} />}
        {role === "agent" && tab === "Recruits" && <RecruitsTab userId={profile.id} />}
        {role === "agent" && tab === "Partners" && <PartnersTab userId={profile.id} />}
        {role === "agent" && tab === "Goals" && <GoalsTab userId={profile.id} />}

        {/* Profile setup notice */}
        {role === "agent" && !profile.director_id && (
          <div style={{ marginTop: 16, background: "#FFF8E6", border: "1px solid #FAEEDA", borderRadius: 10, padding: "14px 18px", fontSize: 13, color: "#633806" }}>
            <strong>Connect to your director:</strong> Ask your director to link you to their team in Supabase, or have them assign your profile a director_id. This unlocks team visibility for them.
          </div>
        )}
      </div>
    </div>
  );
}

function AgentsTable() {
  const [agents, setAgents] = useState([]);
  useEffect(() => {
    supabase.from("profiles").select("*").neq("role", "upline").order("created_at", { ascending: false }).then(({ data }) => setAgents(data || []));
  }, []);
  return (
    <div style={{ background: "#fff", border: "1px solid #ece9e0", borderRadius: 14, padding: "20px 22px" }}>
      <div style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>All users</div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>{["Name", "Email", "Role", "Joined"].map(h => <th key={h} style={{ textAlign: "left", fontSize: 10, fontWeight: 700, color: "#aaa", padding: "0 10px 10px", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {agents.map(a => (
            <tr key={a.id}>
              <td style={{ padding: "8px 10px", borderTop: "1px solid #f0ede6", fontSize: 13, fontWeight: 600 }}>{a.full_name || "—"}</td>
              <td style={{ padding: "8px 10px", borderTop: "1px solid #f0ede6", fontSize: 13, color: "#888" }}>{a.email}</td>
              <td style={{ padding: "8px 10px", borderTop: "1px solid #f0ede6" }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 6, background: a.role === "director" ? "#E1F5EE" : "#E6F1FB", color: a.role === "director" ? "#085041" : "#0C447C" }}>{a.role}</span>
              </td>
              <td style={{ padding: "8px 10px", borderTop: "1px solid #f0ede6", fontSize: 12, color: "#aaa" }}>{new Date(a.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AllLeadsView() {
  const [leads, setLeads] = useState([]);
  const { fmt } = { fmt: (n) => "$" + Math.round(n || 0).toLocaleString() };
  useEffect(() => {
    supabase.from("leads").select("*, agent:profiles!leads_user_id_fkey(full_name)").order("created_at", { ascending: false }).then(({ data }) => setLeads(data || []));
  }, []);
  return (
    <div style={{ background: "#fff", border: "1px solid #ece9e0", borderRadius: 14, padding: "20px 22px" }}>
      <div style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>All leads — org wide</div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>{["Agent", "Client", "Product", "Status", "AP", "Source"].map(h => <th key={h} style={{ textAlign: "left", fontSize: 10, fontWeight: 700, color: "#aaa", padding: "0 10px 10px", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {leads.map(l => (
              <tr key={l.id}>
                <td style={{ padding: "8px 10px", borderTop: "1px solid #f0ede6", fontSize: 12, color: "#888" }}>{l.agent?.full_name || "—"}</td>
                <td style={{ padding: "8px 10px", borderTop: "1px solid #f0ede6", fontSize: 13, fontWeight: 600 }}>{l.name || "—"}</td>
                <td style={{ padding: "8px 10px", borderTop: "1px solid #f0ede6", fontSize: 13 }}>{l.product}</td>
                <td style={{ padding: "8px 10px", borderTop: "1px solid #f0ede6" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 6, background: l.status === "closed" ? "#E1F5EE" : "#f0ede6", color: l.status === "closed" ? "#085041" : "#888" }}>{l.status}</span>
                </td>
                <td style={{ padding: "8px 10px", borderTop: "1px solid #f0ede6", fontSize: 13, fontWeight: 700, color: "#1D9E75" }}>${Math.round(l.ap || 0).toLocaleString()}</td>
                <td style={{ padding: "8px 10px", borderTop: "1px solid #f0ede6", fontSize: 12, color: "#888" }}>{l.source}</td>
              </tr>
            ))}
            {leads.length === 0 && <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", fontSize: 13, color: "#bbb" }}>No leads in the system yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
