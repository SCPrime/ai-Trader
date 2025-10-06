"use client";

import { useState } from "react";
import { Card, Button } from "./ui";
import { theme } from "../styles/theme";

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
    <div style={{ padding: theme.spacing.lg }}>
      <Card glow="teal">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.lg
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: '700',
            color: theme.colors.text,
            textShadow: theme.glow.teal
          }}>
            🌅 Morning Checks
          </h2>
          <Button onClick={run} loading={running} variant="primary">
            Run Checks
          </Button>
        </div>

        {summary && (
          <div style={{
            color: theme.colors.textMuted,
            fontSize: '14px',
            marginBottom: theme.spacing.md,
            fontWeight: '600'
          }}>
            {summary}
          </div>
        )}

        <div style={{ display: 'grid', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
          {results.map((r, i) => (
            <div
              key={i}
              style={{
                border: `1px solid ${r.ok ? theme.colors.primary : theme.colors.danger}`,
                background: r.ok ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 68, 68, 0.1)',
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                boxShadow: r.ok ? theme.glow.green : theme.glow.red
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: theme.spacing.xs,
                alignItems: 'center'
              }}>
                <strong style={{
                  color: theme.colors.text,
                  fontSize: '16px'
                }}>
                  {r.name}
                </strong>
                <span style={{
                  color: r.ok ? theme.colors.primary : theme.colors.danger,
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  {r.ok ? "✅" : "❌"} {r.status} / {r.ms}ms
                </span>
              </div>

              {r.error && (
                <div style={{
                  color: theme.colors.danger,
                  fontSize: '14px',
                  marginTop: theme.spacing.xs
                }}>
                  Error: {r.error}
                </div>
              )}

              {r.body && (
                <pre style={{
                  margin: 0,
                  marginTop: theme.spacing.sm,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  background: theme.background.input,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.sm,
                  padding: theme.spacing.sm,
                  color: theme.colors.textMuted,
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {JSON.stringify(r.body, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>

        {results.length === 0 && !running && (
          <div style={{
            textAlign: 'center',
            padding: theme.spacing.xl,
            color: theme.colors.textMuted
          }}>
            <div style={{ fontSize: '48px', marginBottom: theme.spacing.md }}>☀️</div>
            <div style={{ fontSize: '16px' }}>
              Click "Run Checks" to start your morning routine
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
