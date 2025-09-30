"use client";
import { useEffect, useState } from "react";

interface HealthData {
  status: string;
  time?: string;
  redis?: {
    connected: boolean;
    latency_ms?: number;
  };
}

export default function StatusBar() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      const res = await fetch("/api/proxy/api/health");
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      setHealth(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const statusColor =
    loading ? "#fbbf24" : health?.status === "ok" ? "#10b981" : "#ef4444";
  const statusText = loading ? "Checking..." : health?.status === "ok" ? "Healthy" : "Error";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "12px 16px",
        backgroundColor: "#f9fafb",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        marginBottom: "24px",
      }}
    >
      {/* Status Pill */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: statusColor,
            boxShadow: `0 0 8px ${statusColor}`,
          }}
        />
        <span style={{ fontWeight: "600", fontSize: "14px", color: "#374151" }}>
          {statusText}
        </span>
      </div>

      {/* Redis Status */}
      {health?.redis && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            color: "#6b7280",
          }}
        >
          <span>Redis:</span>
          <span
            style={{
              fontWeight: "600",
              color: health.redis.connected ? "#10b981" : "#ef4444",
            }}
          >
            {health.redis.connected ? "Connected" : "Disconnected"}
          </span>
          {health.redis.connected && health.redis.latency_ms !== undefined && (
            <span style={{ color: "#9ca3af" }}>
              ({health.redis.latency_ms}ms)
            </span>
          )}
        </div>
      )}

      {/* Last Updated */}
      {health?.time && (
        <div style={{ marginLeft: "auto", fontSize: "12px", color: "#9ca3af" }}>
          {new Date(health.time).toLocaleTimeString()}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{ fontSize: "12px", color: "#ef4444", fontWeight: "500" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={fetchHealth}
        disabled={loading}
        style={{
          padding: "6px 12px",
          fontSize: "12px",
          backgroundColor: loading ? "#e5e7eb" : "#3b82f6",
          color: loading ? "#9ca3af" : "white",
          border: "none",
          borderRadius: "4px",
          cursor: loading ? "not-allowed" : "pointer",
          fontWeight: "500",
        }}
      >
        {loading ? "⏳" : "🔄"}
      </button>
    </div>
  );
}
