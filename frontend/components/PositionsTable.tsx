"use client";

import { useEffect, useMemo, useState } from "react";

type AnyRow = Record<string, any>;

export default function PositionsTable() {
  const [rows, setRows] = useState<AnyRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/proxy/api/portfolio/positions", {
        method: "GET",
        headers: { "cache-control": "no-store" },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Positions failed: ${res.status} ${text}`);
      }
      const data = await res.json();
      console.log('API response data:', data);
      // Accept either {positions:[...]} or plain array
      const arr = Array.isArray(data) ? data : Array.isArray(data?.positions) ? data.positions : [];
      console.log('Setting rows to:', arr);
      setRows(arr);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const columns = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    // Preferred columns first (if present), then any others
    const preferred = ["symbol", "qty", "quantity", "avgPrice", "average_price", "currentPrice", "marketValue", "unrealizedPnL"];
    const keys = new Set<string>();
    for (const k of preferred) if (k in rows[0]) keys.add(k);
    Object.keys(rows[0]).forEach((k) => keys.add(k));
    return Array.from(keys).slice(0, 10); // keep table tidy
  }, [rows]);

  return (
    <div style={card}>
      <div style={cardHeader}>
        <h3 style={title}>📈 Positions</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {lastRefreshed && <span style={muted}>Refreshed {lastRefreshed}</span>}
          <button onClick={load} disabled={loading} style={btnPrimary}>
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {error && <div style={errorBox}>Error: {error}</div>}

      {!error && (!rows || rows.length === 0) && (
        <div style={muted}>No positions to show.</div>
      )}

      {!error && rows && rows.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={tableCss}>
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c} style={thCss}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c} style={tdCss}>
                      {formatCell(r[c])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatCell(v: any) {
  if (v == null) return "";
  if (typeof v === "number") return Number.isInteger(v) ? v : v.toFixed(2);
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

// Dark theme inline styles
const card: React.CSSProperties = { padding: 16, background: "#1f2937", border: "1px solid #374151", borderRadius: 12 };
const cardHeader: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 };
const title: React.CSSProperties = { margin: 0, fontSize: 18, color: "#f9fafb" };
const muted: React.CSSProperties = { color: "#9ca3af", fontSize: 13 };
const btnPrimary: React.CSSProperties = { padding: "8px 12px", borderRadius: 8, border: "1px solid #3b82f6", background: "#3b82f6", color: "#fff", cursor: "pointer" };
const errorBox: React.CSSProperties = { padding: 12, border: "1px solid #ef4444", background: "#7f1d1d", color: "#fecaca", borderRadius: 8, marginBottom: 12 };
const tableCss: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 13, color: "#f9fafb" };
const thCss: React.CSSProperties = { textAlign: "left", padding: "8px 10px", borderBottom: "1px solid #374151", whiteSpace: "nowrap", background: "#374151", color: "#f9fafb" };
const tdCss: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid #374151", whiteSpace: "nowrap" };
