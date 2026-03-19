import React, { useState, useEffect } from "react";
import { supabase } from "./supabase";
import LoginPage from "./LoginPage";
import Dashboard from "./Dashboard";
import ContactTracker from "./ContactTracker";
import RecruitsSection from "./RecruitsSection";
import CalendarSection from "./CalendarSection";
import ProductionSection from "./ProductionSection";
import LicensingSection from "./LicensingSection";
import ReportsSection from "./ReportsSection";
import OrgChart from "./OrgChart";
import InviteSection from "./InviteSection";
import UplineView from "./UplineView";
import "./styles.css";

const NAV = {
  upline: [
    { id: "dashboard", label: "Dashboard" },
    { id: "org", label: "My Organization" },
    { id: "contacts", label: "Contacts" },
    { id: "production", label: "Production" },
    { id: "reports", label: "Reports" },
  ],
  director: [
    { id: "dashboard", label: "Dashboard" },
    { id: "contacts", label: "Contacts" },
    { id: "recruits", label: "Recruits" },
    { id: "calendar", label: "Calendar" },
    { id: "production", label: "Production" },
    { id: "licensing", label: "Licensing" },
    { id: "reports", label: "Reports" },
    { id: "org", label: "My Organization" },
    { id: "invite", label: "Invite Your Team" },
  ],
  agent: [
    { id: "dashboard", label: "Dashboard" },
    { id: "contacts", label: "Contacts" },
    { id: "recruits", label: "Recruits" },
    { id: "calendar", label: "Calendar" },
    { id: "production", label: "Production" },
    { id: "licensing", label: "Licensing" },
    { id: "reports", label: "Reports" },
    { id: "invite", label: "Invite Your Team" },
  ],
};

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) sessionStorage.setItem("invite_ref", ref);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s);
      if (s) {
        const invRef = sessionStorage.getItem("invite_ref");
        if (invRef) { await supabase.from("profiles").update({ director_id: invRef }).eq("id", s.user.id); sessionStorage.removeItem("invite_ref"); }
        loadProfile(s.user.id);
      } else { setProfile(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (uid) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
    setProfile(data); setLoading(false); setTab("dashboard");
  };

  const logout = async () => { await supabase.auth.signOut(); setTab(null); };

  if (loading) return (
    <div className="splash">
      <div className="splash-inner">
        <div className="splash-logo">
          <span className="logo-b2b">B2B</span>
          <span className="logo-crm"> CRM</span>
        </div>
        <div className="splash-sub">Loading your workspace...</div>
        <div className="splash-bar">
          <div className="splash-bar-fill"></div>
        </div>
      </div>
    </div>
  );

  if (!session) return <LoginPage />;

  if (!profile) return (
    <div className="splash">
      <div className="splash-inner">
        <div className="splash-logo">
          <span className="logo-b2b">B2B</span>
          <span className="logo-crm"> CRM</span>
        </div>
        <div className="splash-sub">Setting up your profile...</div>
        <button onClick={logout} className="splash-signout">Sign out</button>
      </div>
    </div>
  );

  const role = profile.role || "agent";
  const navItems = NAV[role] || NAV.agent;

  return (
    <div className="app-shell">
      <aside className={"sidebar" + (collapsed ? " collapsed" : "")}>
        <div className="sidebar-header">
          {!collapsed && (
            <div className="sidebar-logo">
              <span className="logo-b2b">B2B</span>
              <span className="logo-crm"> CRM</span>
            </div>
          )}
          <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? ">" : "<"}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={"nav-item" + (tab === item.id ? " active" : "")}
              onClick={() => setTab(item.id)}
            >
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="agent-card">
            <div className="agent-avatar">{(profile.full_name || "?")[0].toUpperCase()}</div>
            {!collapsed && (
              <div className="agent-info">
                <div className="agent-name">{profile.full_name}</div>
                <div className={`agent-role ${role}`}>{role}</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button className="btn btn-ghost btn-sm logout-btn" onClick={logout}>
              Sign Out
            </button>
          )}
        </div>
      </aside>

      <main className="main-content">
        {tab === "dashboard" && <Dashboard user={session.user} profile={profile} />}
        {tab === "contacts" && <ContactTracker user={session.user} profile={profile} />}
        {tab === "recruits" && <RecruitsSection user={session.user} profile={profile} />}
        {tab === "calendar" && <CalendarSection user={session.user} profile={profile} />}
        {tab === "production" && <ProductionSection user={session.user} profile={profile} />}
        {tab === "licensing" && <LicensingSection user={session.user} profile={profile} />}
        {tab === "reports" && <ReportsSection user={session.user} profile={profile} />}
        {tab === "org" && <OrgChart user={session.user} profile={profile} />}
        {tab === "invite" && <InviteSection user={session.user} profile={profile} />}
        {tab === "upline" && <UplineView user={session.user} profile={profile} />}
      </main>
    </div>
  );
}
