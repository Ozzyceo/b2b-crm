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
      { id:"dashboard", label:"Dashboard" },
      { id:"org", label:"My Organization" },
      { id:"contacts", label:"Contacts" },
      { id:"production", label:"Production" },
      { id:"reports", label:"Reports" },
        ],
    director: [
      { id:"dashboard", label:"Dashboard" },
      { id:"contacts", label:"Contacts" },
      { id:"recruits", label:"Recruits" },
      { id:"calendar", label:"Calendar" },
      { id:"production", label:"Production" },
      { id:"licensing", label:"Licensing" },
      { id:"reports", label:"Reports" },
      { id:"org", label:"My Organization" },
      { id:"invite", label:"Invite Your Team" },
        ],
    agent: [
      { id:"dashboard", label:"Dashboard" },
      { id:"contacts", label:"Contacts" },
      { id:"recruits", label:"Recruits" },
      { id:"calendar", label:"Calendar" },
      { id:"production", label:"Production" },
      { id:"licensing", label:"Licensing" },
      { id:"reports", label:"Reports" },
      { id:"invite", label:"Invite Your Team" },
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
                      <div className="splash-logo"><span className="logo-b2b">B2B</span>span><span className="logo-crm"> CRM</span>span></div>div>
                      <div className="splash-sub">Loading your workspace...</div>div>
                      <div className="splash-bar"><div className="splash-bar-fill" /></div>div>
              </div>div>
        </div>div>
      );
  
    if (!session) return <LoginPage />;
    if (!profile) return (
          <div className="splash">
                <div className="splash-inner">
                        <div className="splash-logo"><span className="logo-b2b">B2B</span>span><span className="logo-crm"> CRM</span>span></div>div>
                        <div className="splash-sub">Setting up your profile...</div>div>
                        <button onClick={logout} className="splash-signout">Sign out</button>button>
                </div>div>
          </div>div>
        );
  
    const role = profile.role || "agent";
    const navItems = NAV[role] || NAV.agent;
  
    return (
          <div className="app-shell">
                <aside className={"sidebar" + (collapsed ? " collapsed" : "")}>
                        <div className="sidebar-header">
                          {!collapsed && <div className="sidebar-logo"><span className="logo-b2b">B2B</span>span><span className="logo-crm"> CRM</span>span></div>div>}
                                  <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>{collapsed ? ">" : "<"}</button>button>
                        </div>div>
                        <nav className="sidebar-nav">
                          {navItems.map(item => (
                        <button key={item.id} className={"nav-item" + (tab === item.id ? " active" : "")} onClick={() => setTab(item.id)} title={collapsed ? item.label : ""}>
                                      <span className="nav-label">{item.label}</span>span>
                        </button>button>
                      ))}
                        </nav>nav>
                  {!collapsed && (
                      <div className="sidebar-footer">
                                  <div className="sidebar-user">
                                                <div className="user-avatar">{(profile.full_name || profile.email || "?")[0].toUpperCase()}</div>div>
                                                <div className="user-info">
                                                                <div className="user-name">{profile.full_name || "Agent"}</div>div>
                                                                <div className={"user-role role-" + role}>{role}</div>div>
                                                </div>div>
                                  </div>div>
                                  <button onClick={logout} className="signout-btn">Sign out</button>button>
                      </div>div>
                        )}
                </aside>aside>
                <main className="main-content">
                        <div className="page-header">
                                  <div className="page-title-group">
                                              <h1 className="page-title">{navItems.find(n => n.id === tab)?.label || "Dashboard"}</h1>h1>
                                              <span className={"role-badge role-" + role}>{role}</span>span>
                                  </div>div>
                        </div>div>
                        <div className="page-body">
                          {tab === "dashboard" && (role === "upline" ? <UplineView profile={profile} /> : <Dashboard profile={profile} role={role} />)}
                          {tab === "contacts" && <ContactTracker profile={profile} role={role} />}
                          {tab === "recruits" && <RecruitsSection profile={profile} role={role} />}
                          {tab === "calendar" && <CalendarSection profile={profile} role={role} />}
                          {tab === "production" && <ProductionSection profile={profile} role={role} />}
                          {tab === "licensing" && <LicensingSection profile={profile} role={role} />}
                          {tab === "reports" && <ReportsSection profile={profile} role={role} />}
                          {tab === "org" && <OrgChart profile={profile} role={role} />}
                          {tab === "invite" && <InviteSection profile={profile} role={role} />}
                        </div>div>
                </main>main>
          </div>div>
        );
}</div>
