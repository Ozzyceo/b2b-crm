import React, { useState } from "react";
import { supabase } from "./supabase";

export default function LoginPage() {
    const [mode, setMode] = useState("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [msg, setMsg] = useState(null);
    const [loading, setLoading] = useState(false);

  const getInviteRef = () => {
        const params = new URLSearchParams(window.location.search);
        return params.get("ref") || null;
  };

  const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg(null);

        if (mode === "login") {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) setMsg({ type: "error", text: error.message });
        } else {
                const { data, error } = await supabase.auth.signUp({
                          email,
                          password,
                          options: { data: { full_name: name } },
                });
                if (error) {
                          setMsg({ type: "error", text: error.message });
                } else if (data.user) {
                          const inviteRef = getInviteRef();
                          const { error: profileError } = await supabase.from("profiles").insert({
                                      id: data.user.id,
                                      full_name: name,
                                      email,
                                      role: "agent",
                                      upline_id: inviteRef || null,
                          });
                          if (profileError) setMsg({ type: "error", text: profileError.message });
                          else setMsg({ type: "success", text: "Account created! Please check your email to verify." });
                }
        }
        setLoading(false);
  };

  return (
        <div className="login-page">
              <div className="login-bg">
                      <div className="login-bg-orb orb-1"></div>div>
                      <div className="login-bg-orb orb-2"></div>div>
                      <div className="login-bg-orb orb-3"></div>div>
              </div>div>
        
              <div className="login-container">
                      <div className="login-brand">
                                <div className="login-logo">
                                            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                                                          <rect width="40" height="40" rx="12" fill="url(#grad)"/>
                                                          <path d="M12 28L20 12L28 28M16 23H24" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                                                          <defs>
                                                                          <linearGradient id="grad" x1="0" y1="0" x2="40" y2="40">
                                                                                            <stop offset="0%" stopColor="#00d492"/>
                                                                                            <stop offset="100%" stopColor="#4f8ef7"/>
                                                                          </linearGradient>linearGradient>
                                                          </defs>defs>
                                            </svg>svg>
                                </div>div>
                                <div>
                                            <h1 className="login-title">B2B CRM</h1>h1>
                                            <p className="login-subtitle">Insurance Team Platform</p>p>
                                </div>div>
                      </div>div>
              
                      <div className="login-card">
                                <div className="login-tabs">
                                            <button
                                                            className={`login-tab${mode === "login" ? " active" : ""}`}
                                                            onClick={() => { setMode("login"); setMsg(null); }}
                                                          >Sign In</button>button>
                                            <button
                                                            className={`login-tab${mode === "signup" ? " active" : ""}`}
                                                            onClick={() => { setMode("signup"); setMsg(null); }}
                                                          >Create Account</button>button>
                                </div>div>
                      
                                <form onSubmit={submit} className="login-form">
                                  {mode === "signup" && (
                        <div className="form-group">
                                        <label className="form-label">Full Name</label>label>
                                        <input
                                                            className="form-input"
                                                            type="text"
                                                            placeholder="Your full name"
                                                            value={name}
                                                            onChange={(e) => setName(e.target.value)}
                                                            required
                                                          />
                        </div>div>
                                            )}
                                
                                            <div className="form-group">
                                                          <label className="form-label">Email Address</label>label>
                                                          <input
                                                                            className="form-input"
                                                                            type="email"
                                                                            placeholder="you@example.com"
                                                                            value={email}
                                                                            onChange={(e) => setEmail(e.target.value)}
                                                                            required
                                                                          />
                                            </div>div>
                                
                                            <div className="form-group">
                                                          <label className="form-label">Password</label>label>
                                                          <input
                                                                            className="form-input"
                                                                            type="password"
                                                                            placeholder={mode === "signup" ? "Create a strong password" : "Your password"}
                                                                            value={password}
                                                                            onChange={(e) => setPassword(e.target.value)}
                                                                            required
                                                                          />
                                            </div>div>
                                
                                  {msg && (
                        <div className={`login-msg ${msg.type}`}>
                          {msg.type === "error" ? "⚠️" : "✅"} {msg.text}
                        </div>div>
                                            )}
                                
                                            <button className="btn btn-primary login-btn" type="submit" disabled={loading}>
                                              {loading ? (
                          <span className="loading-dots">
                                            <span></span>span><span></span>span><span></span>span>
                          </span>span>
                        ) : mode === "login" ? "Sign In" : "Create Account"}
                                            </button>button>
                                </form>form>
                      
                        {mode === "signup" && (
                      <p className="login-note">
                                    New accounts are created as <strong>Agent</strong>strong>. Your director will
                                    update your role if needed.
                      </p>p>
                                )}
                      </div>div>
              
                      <p className="login-footer">
                                &copy; 2025 B2B CRM &mdash; Built for insurance professionals
                      </p>p>
              </div>div>
        </div>div>
      );
}</div>
