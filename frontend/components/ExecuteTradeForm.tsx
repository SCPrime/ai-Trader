"use client";
import { useState } from "react";

interface Order {
  symbol: string;
  side: "buy" | "sell";
  qty: number;
  type: "market" | "limit";
  limitPrice?: number;
}

interface ExecuteResponse {
  accepted: boolean;
  duplicate?: boolean;
  dryRun?: boolean;
  orders?: Order[];
}

export default function ExecuteTradeForm() {
  const [symbol, setSymbol] = useState("SPY");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [qty, setQty] = useState(1);
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [limitPrice, setLimitPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ExecuteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRequestId, setLastRequestId] = useState<string | null>(null);

  const generateRequestId = () =>
    `req-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!symbol || symbol.trim() === "") {
      setError("Symbol is required");
      return;
    }
    if (qty <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }
    if (orderType === "limit" && (!limitPrice || parseFloat(limitPrice) <= 0)) {
      setError("Limit price is required for limit orders");
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    const requestId = generateRequestId();
    setLastRequestId(requestId);

    const order: Order = {
      symbol: symbol.trim().toUpperCase(),
      side,
      qty,
      type: orderType,
    };

    if (orderType === "limit") {
      order.limitPrice = parseFloat(limitPrice);
    }

    const body = {
      dryRun: true, // Always dry-run for now
      requestId,
      orders: [order],
    };

    try {
      const res = await fetch("/api/proxy/api/trading/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}`);
      }

      const data: ExecuteResponse = await res.json();
      setResponse(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testDuplicate = async () => {
    if (!lastRequestId) {
      setError("No previous request to duplicate. Submit a new order first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    const order: Order = {
      symbol: symbol.trim().toUpperCase(),
      side,
      qty,
      type: orderType,
    };

    if (orderType === "limit") {
      order.limitPrice = parseFloat(limitPrice);
    }

    const body = {
      dryRun: true,
      requestId: lastRequestId, // Re-use same ID
      orders: [order],
    };

    try {
      const res = await fetch("/api/proxy/api/trading/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}`);
      }

      const data: ExecuteResponse = await res.json();
      setResponse(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    width: "100%",
    fontFamily: "system-ui, sans-serif",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "6px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: "600",
    border: "none",
    borderRadius: "6px",
    cursor: loading ? "not-allowed" : "pointer",
    transition: "all 0.2s",
  };

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: loading ? "#9ca3af" : "#3b82f6",
    color: "white",
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: loading ? "#f3f4f6" : "#e5e7eb",
    color: loading ? "#9ca3af" : "#374151",
  };

  return (
    <div
      style={{
        backgroundColor: "white",
        padding: "24px",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: "20px", fontSize: "20px", color: "#111827" }}>
        Execute Trade (Dry-Run)
      </h2>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {/* Symbol */}
          <div>
            <label style={labelStyle}>Symbol</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="SPY, AAPL, QQQ..."
              style={inputStyle}
              disabled={loading}
              required
            />
          </div>

          {/* Side */}
          <div>
            <label style={labelStyle}>Side</label>
            <select
              value={side}
              onChange={(e) => setSide(e.target.value as "buy" | "sell")}
              style={inputStyle}
              disabled={loading}
            >
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label style={labelStyle}>Quantity</label>
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value) || 0)}
              min="1"
              step="1"
              style={inputStyle}
              disabled={loading}
              required
            />
          </div>

          {/* Order Type */}
          <div>
            <label style={labelStyle}>Order Type</label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value as "market" | "limit")}
              style={inputStyle}
              disabled={loading}
            >
              <option value="market">Market</option>
              <option value="limit">Limit</option>
            </select>
          </div>

          {/* Limit Price (conditional) */}
          {orderType === "limit" && (
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Limit Price</label>
              <input
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                min="0.01"
                step="0.01"
                placeholder="0.00"
                style={inputStyle}
                disabled={loading}
                required
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
          <button type="submit" style={primaryButtonStyle} disabled={loading}>
            {loading ? "Submitting..." : "Submit Order (Dry-Run)"}
          </button>

          {lastRequestId && (
            <button
              type="button"
              onClick={testDuplicate}
              style={secondaryButtonStyle}
              disabled={loading}
              title="Re-send with same requestId to test duplicate detection"
            >
              Test Duplicate
            </button>
          )}
        </div>
      </form>

      {/* Last Request ID */}
      {lastRequestId && (
        <div
          style={{
            marginTop: "16px",
            padding: "10px 12px",
            backgroundColor: "#f3f4f6",
            borderRadius: "6px",
            fontSize: "12px",
            color: "#6b7280",
            fontFamily: "monospace",
          }}
        >
          <strong>Last Request ID:</strong> {lastRequestId}
        </div>
      )}

      {/* Response Display */}
      {response && (
        <div
          style={{
            marginTop: "20px",
            padding: "16px",
            backgroundColor: response.duplicate ? "#fef3c7" : "#d1fae5",
            border: `1px solid ${response.duplicate ? "#fbbf24" : "#10b981"}`,
            borderRadius: "8px",
          }}
        >
          <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
            {response.duplicate ? "⚠️ Duplicate Detected" : "✅ Order Accepted"}
          </div>
          <pre
            style={{
              fontSize: "12px",
              fontFamily: "monospace",
              margin: 0,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div
          style={{
            marginTop: "20px",
            padding: "16px",
            backgroundColor: "#fee2e2",
            border: "1px solid #ef4444",
            borderRadius: "8px",
            color: "#991b1b",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          ❌ {error}
        </div>
      )}
    </div>
  );
}
