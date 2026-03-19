import React, { useState } from "react";
import { supabase } from "./supabase";

export default function LoginPage() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("agent");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setMsg(null);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg({ type: "error", text: error.message });
    } else {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name, role } },
      });
      if (error) setMsg({ type: "error", text: error.message });
      else setMsg({ type: "success", text: "Check your email to confirm your account, then sign in." });
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#0d0f14" }}>
      {/* Left panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 80px", maxWidth: 560 }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#1D9E75", fontWeight: 700, marginBottom: 12 }}>
            Biz to Biz
          </div>
          <h1 style={{ fontSize: 38, fontWeight: 700, color: "#fff", lineHeight: 1.1, marginBottom: 14 }}>
            Team CRM<br /><span style={{ color: "#1D9E75" }}>Platform</span>
          </h1>
          <p style={{ fontSize: 15, color: "#666", lineHeight: 1.7 }}>
            Track leads, recruits, and team production.<br />
            Built for field directors who are serious about acquisition.
          </p>
        </div>
        {["Leads & pipeline tracking", "Recruit management", "Team AP & override calculator", "Director + agent role access", "Referral partner tracker"].map(f => (
          <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#1D9E7520", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#1D9E75" }} />
            </div>
            <span style={{ fontSize: 14, color: "#777" }}>{f}</span>
          </div>
        ))}
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ width: "100%", maxWidth: 400, background: "#fff", borderRadius: 20, padding: "40px 36px", boxShadow: "0 32px 80px rgba(0,0,0,0.4)" }}>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a" }}>
              {mode === "login" ? "Sign in" : "Create account"}
            </h2>
            <p style={{ fontSize: 13, color: "#999", marginTop: 4 }}>
              {mode === "login" ? "Welcome back to your team dashboard" : "Join the B2B CRM platform"}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mode === "signup" && (
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name"
                style={iStyle} />
            )}
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" type="email"
              style={iStyle} />
            <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password"
              onKeyDown={e => e.key === "Enter" && submit()} style={iStyle} />

            {mode === "signup" && (
              <div>
                <label style={{ fontSize: 11, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, display: "block", marginBottom: 6 }}>Role</label>
                <select value={role} onChange={e => setRole(e.target.value)} style={{ ...iStyle, appearance: "none" }}>
                  <option value="agent">Agent</option>
                  <option value="director">Director (Field Director)</option>
                  <option value="upline">Upline</option>
                </select>
              </div>
            )}

            {msg && (
              <div style={{ fontSize: 12, padding: "10px 14px", borderRadius: 8, background: msg.type === "error" ? "#FCEBEB" : "#E1F5EE", color: msg.type === "error" ? "#791F1F" : "#085041" }}>
                {msg.text}
              </div>
            )}

            <button onClick={submit} disabled={loading}
              style={{ padding: "13px", background: "#1D9E75", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: loading ? "wait" : "pointer", marginTop: 4, letterSpacing: "0.02em" }}>
              {loading ? "Please wait..." : mode === "login" ? "Sign in →" : "Create account →"}
            </button>

            <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMsg(null); }}
              style={{ background: "none", border: "none", fontSize: 13, color: "#aaa", cursor: "pointer", marginTop: 4 }}>
              {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const iStyle = {
  padding: "11px 14px", border: "1px solid #e8e8e8", borderRadius: 9, fontSize: 14,
  color: "#1a1a1a", background: "#fafaf8", outline: "none", width: "100%",
};
