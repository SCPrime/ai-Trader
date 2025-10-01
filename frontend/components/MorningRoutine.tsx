"use client";

import { useState } from "react";

type Result = {
  name: string;
  ok: boolean;
  status: number | "n/a";
  ms: number | "n/a";
  body?: any;
  error?: string;
};

async function timedJson(url: string, init?: RequestInit): Promise<Result> {
  const name = url.split("/api/").pop() || url;
  const t0 = performance.now();
  try {
    const res = await fetch(url, { ...init, headers: { "cache-control": "no-store", ...(init?.headers || {}) } });
    const ms = Math.round(performance.now() - t0);
    const ok = res.ok;
    let body: any = undefined;
    try { body = await res.json(); } catch {}
    return { name, ok, status: res.status, ms, body };
  } catch (e: any) {
    const ms = Math.round(performance.now() - t0);
    return { name, ok: false, status: "n/a", ms, error: e?.message || String(e) };
  }
}

export default function MorningRoutine() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [summary, setSummary] = useState<string>("");

  async function run() {
    setRunning(true);
    setResults([]);
    setSummary("");

    const out: Result[] = [];

    // 1) Health
    out.push(await timedJson("/api/proxy/api/health"));

    // 2) Settings
    out.push(await timedJson("/api/proxy/api/settings"));

    // 3) Positions
    out.push(await timedJson("/api/proxy/api/portfolio/positions"));

    // (Optional future) any other checks your backend exposes

    setResults(out);
    const okCount = out.filter((r) => r.ok).length;
    setSummary(`${okCount}/${out.length} checks passed`);
    setRunning(false);
  }

  return (
    <div style={card}>
      <div style={cardHeader}>
        <h3 style={title}>🌅 Morning Checks</h3>
        <button onClick={run} disabled={running} style={btnPrimary}>
          {running ? "Running…" : "Run Checks"}
        </button>
      </div>

      {summary && <div style={muted}>{summary}</div>}

      <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
        {results.map((r, i) => (
          <div key={i} style={rowBox(r.ok)}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <strong>{r.name}</strong>
              <span>{r.ok ? "✅" : "❌"} {r.status}/{r.ms}ms</span>
            </div>
            {r.error && <div style={{ color: "#991b1b" }}>Error: {r.error}</div>}
            {r.body && <pre style={pre}>{JSON.stringify(r.body, null, 2)}</pre>}
          </div>
        ))}
      </div>
    </div>
  );
}

const card: React.CSSProperties = { padding: 24, background: "#1f2937", border: "1px solid #374151", borderRadius: 12 };
const cardHeader: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 };
const title: React.CSSProperties = { margin: 0, fontSize: 24, color: "#f9fafb", fontWeight: 700 };
const btnPrimary: React.CSSProperties = { padding: "8px 16px", borderRadius: 8, border: "none", background: "#3b82f6", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 };
const muted: React.CSSProperties = { color: "#9ca3af", fontSize: 14, marginBottom: 12 };
const rowBox = (ok: boolean): React.CSSProperties => ({
  border: `1px solid ${ok ? "#10b981" : "#ef4444"}`,
  background: ok ? "#064e3b" : "#7f1d1d",
  color: ok ? "#d1fae5" : "#fecaca",
  borderRadius: 8,
  padding: 12,
});
const pre: React.CSSProperties = { margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", background: "#111827", border: "1px solid #374151", borderRadius: 6, padding: 8, color: "#9ca3af", fontSize: 12 };
