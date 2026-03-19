import React from "react";

export const OVERRIDE_RATE = 0.25;
export const PERSONAL_RATE = 0.75;
export const CASHFLOW_GOAL = 50000;
export const AP_GOAL = 67000;

export const fmt = (n) => "$" + Math.round(n || 0).toLocaleString();
export const pct = (a, b) => (b === 0 ? 0 : Math.min(100, Math.round(((a || 0) / b) * 100)));

export const STATUS_MAP = {
  new: { label: "New", bg: "#E6F1FB", color: "#0C447C" },
  appt: { label: "Appt set", bg: "#EAF3DE", color: "#27500A" },
  app: { label: "App submitted", bg: "#FAEEDA", color: "#633806" },
  closed: { label: "Closed", bg: "#E1F5EE", color: "#085041" },
  lost: { label: "Lost", bg: "#FCEBEB", color: "#791F1F" },
  prospect: { label: "Prospect", bg: "#E6F1FB", color: "#0C447C" },
  presented: { label: "Presented", bg: "#FAEEDA", color: "#633806" },
  licensed: { label: "Getting licensed", bg: "#EEEDFE", color: "#3C3489" },
  active: { label: "Active agent", bg: "#E1F5EE", color: "#085041" },
  inactive: { label: "Dropped off", bg: "#FCEBEB", color: "#791F1F" },
};

export const Badge = ({ status }) => {
  const s = STATUS_MAP[status] || { label: status, bg: "#f0f0f0", color: "#555" };
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, padding: "2px 9px", borderRadius: 6, fontWeight: 600, whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
};

export const ProgressBar = ({ value, max, color = "#1D9E75", height = 6 }) => (
  <div style={{ height, background: "#e8e8e3", borderRadius: height / 2, overflow: "hidden" }}>
    <div style={{ width: pct(value, max) + "%", height: "100%", background: color, borderRadius: height / 2, transition: "width .4s ease" }} />
  </div>
);

export const MetricCard = ({ label, value, sub, accent }) => (
  <div style={{ background: "#fff", border: "1px solid #ece9e0", borderRadius: 12, padding: "16px 18px", borderLeft: accent ? `4px solid ${accent}` : undefined }}>
    <div style={{ fontSize: 11, color: "#999", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: accent || "#1a1a1a", lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: "#aaa", marginTop: 5 }}>{sub}</div>}
  </div>
);

export const Card = ({ children, style }) => (
  <div style={{ background: "#fff", border: "1px solid #ece9e0", borderRadius: 14, padding: "20px 22px", marginBottom: 16, ...style }}>
    {children}
  </div>
);

export const CardHeader = ({ title, action }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
    <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</span>
    {action}
  </div>
);

export const AddBtn = ({ onClick, label = "+ Add" }) => (
  <button onClick={onClick} style={{ fontSize: 12, padding: "5px 12px", border: "1px solid #ddd", borderRadius: 7, background: "transparent", color: "#555", cursor: "pointer", fontWeight: 600 }}>
    {label}
  </button>
);

export const Th = ({ children, w }) => (
  <th style={{ textAlign: "left", fontSize: 10, fontWeight: 700, color: "#aaa", padding: "0 10px 10px", textTransform: "uppercase", letterSpacing: "0.07em", width: w, whiteSpace: "nowrap" }}>
    {children}
  </th>
);

export const Td = ({ children, style }) => (
  <td style={{ padding: "8px 10px", borderTop: "1px solid #f0ede6", fontSize: 13, color: "#1a1a1a", verticalAlign: "middle", ...style }}>
    {children}
  </td>
);

export const Input = ({ value, onChange, placeholder, disabled, style, type = "text" }) => (
  <input type={type} value={value || ""} onChange={onChange} placeholder={placeholder} disabled={disabled}
    style={{ fontSize: 13, padding: "5px 8px", border: "1px solid #e0ddd6", borderRadius: 6, background: disabled ? "#fafaf8" : "#fff", color: "#1a1a1a", width: "100%", outline: "none", ...style }} />
);

export const Select = ({ value, onChange, options, disabled }) => (
  <select value={value || ""} onChange={onChange} disabled={disabled}
    style={{ fontSize: 13, padding: "5px 8px", border: "1px solid #e0ddd6", borderRadius: 6, background: "#fff", color: "#1a1a1a", width: "100%", outline: "none" }}>
    {options.map(o => typeof o === "string"
      ? <option key={o} value={o}>{o}</option>
      : <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

export const DelBtn = ({ onClick }) => (
  <button onClick={onClick} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 16, padding: "0 4px", lineHeight: 1 }}
    onMouseEnter={e => e.target.style.color = "#E24B4A"} onMouseLeave={e => e.target.style.color = "#ccc"}>
    ×
  </button>
);

export const EmptyRow = ({ cols, message = "No records yet" }) => (
  <tr><td colSpan={cols} style={{ padding: "24px", textAlign: "center", fontSize: 13, color: "#bbb", fontStyle: "italic" }}>{message}</td></tr>
);

export const GoalRow = ({ label, done, target, color = "#1D9E75", onUpdate }) => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
      <span style={{ fontSize: 13, color: "#555" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input type="number" min="0" value={done} onChange={e => onUpdate(parseInt(e.target.value) || 0)}
          style={{ width: 44, textAlign: "center", fontSize: 13, padding: "2px 4px", border: "1px solid #e0ddd6", borderRadius: 5, fontFamily: "DM Mono, monospace" }} />
        <span style={{ fontSize: 12, color: "#bbb" }}>/ {target}</span>
      </div>
    </div>
    <ProgressBar value={done} max={target} color={color} />
  </div>
);
