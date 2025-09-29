"use client";
import { useState } from "react";
import { health, getSettings, getPositions, executeDryRun } from "../lib/api";

export default function ApiButtons() {
  const [log, setLog] = useState<string>("");
  const [loading, setLoading] = useState<string>("");

  const runApi = (name: string, fn: () => Promise<any>) => async () => {
    setLoading(name);
    setLog(`${name}: Loading...`);
    try {
      const result = await fn();
      setLog(`${name}: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      setLog(`${name} ERROR: ${error.message}`);
    } finally {
      setLoading("");
    }
  };

  const buttonStyle = {
    padding: "12px 24px",
    margin: "8px",
    backgroundColor: "#0070f3",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500"
  };

  const disabledStyle = {
    ...buttonStyle,
    backgroundColor: "#ccc",
    cursor: "not-allowed"
  };

  return (
    <div style={{ padding: "24px", maxWidth: "800px" }}>
      <h2>AI Trader API Test</h2>
      <p>Connected to: {process.env.NEXT_PUBLIC_API_BASE_URL}</p>

      <div style={{ marginBottom: "24px" }}>
        <button
          style={loading === "Health" ? disabledStyle : buttonStyle}
          onClick={runApi("Health", health)}
          disabled={!!loading}
        >
          GET /api/health
        </button>

        <button
          style={loading === "Settings" ? disabledStyle : buttonStyle}
          onClick={runApi("Settings", getSettings)}
          disabled={!!loading}
        >
          GET /api/settings
        </button>

        <button
          style={loading === "Positions" ? disabledStyle : buttonStyle}
          onClick={runApi("Positions", getPositions)}
          disabled={!!loading}
        >
          GET /api/portfolio/positions (Bearer)
        </button>

        <button
          style={loading === "Execute" ? disabledStyle : buttonStyle}
          onClick={runApi("Execute", executeDryRun)}
          disabled={!!loading}
        >
          POST /api/trading/execute (dryRun+requestId, Bearer)
        </button>
      </div>

      <div style={{
        backgroundColor: "#f5f5f5",
        padding: "16px",
        borderRadius: "6px",
        fontFamily: "monospace",
        fontSize: "12px",
        minHeight: "200px",
        whiteSpace: "pre-wrap",
        border: "1px solid #ddd"
      }}>
        <strong>JSON Response Log:</strong>
        <br />
        {log || "Click buttons to test API endpoints..."}
      </div>
    </div>
  );
}