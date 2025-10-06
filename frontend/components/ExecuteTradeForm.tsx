"use client";
import { useState } from "react";
import { Card, Input, Select, Button } from "./ui";
import { theme } from "../styles/theme";

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
      const res = await fetch("/api/proxy/trading/execute", {
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
      const res = await fetch("/api/proxy/trading/execute", {
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

  return (
    <Card glow="green">
      <h2 style={{
        marginTop: 0,
        marginBottom: theme.spacing.lg,
        fontSize: '24px',
        color: theme.colors.primary,
        textShadow: theme.glow.green
      }}>
        ⚡ Execute Trade
      </h2>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: theme.spacing.md }}>
          <Input
            label="Symbol"
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="SPY, AAPL, QQQ..."
            disabled={loading}
            required
          />

          <Select
            label="Side"
            value={side}
            onChange={(e) => setSide(e.target.value as "buy" | "sell")}
            options={[
              { value: "buy", label: "Buy" },
              { value: "sell", label: "Sell" },
            ]}
            disabled={loading}
          />

          <Input
            label="Quantity"
            type="number"
            value={qty}
            onChange={(e) => setQty(parseInt(e.target.value) || 0)}
            min="1"
            step="1"
            disabled={loading}
            required
          />

          <Select
            label="Order Type"
            value={orderType}
            onChange={(e) => setOrderType(e.target.value as "market" | "limit")}
            options={[
              { value: "market", label: "Market" },
              { value: "limit", label: "Limit" },
            ]}
            disabled={loading}
          />

          {orderType === "limit" && (
            <div style={{ gridColumn: "1 / -1" }}>
              <Input
                label="Limit Price"
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                min="0.01"
                step="0.01"
                placeholder="0.00"
                disabled={loading}
                required
              />
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: theme.spacing.md, marginTop: theme.spacing.lg }}>
          <Button type="submit" loading={loading} variant="primary">
            Submit Order (Dry-Run)
          </Button>

          {lastRequestId && (
            <Button
              type="button"
              onClick={testDuplicate}
              loading={loading}
              variant="secondary"
            >
              Test Duplicate
            </Button>
          )}
        </div>
      </form>

      {lastRequestId && (
        <div
          style={{
            marginTop: theme.spacing.md,
            padding: theme.spacing.md,
            background: theme.background.input,
            borderRadius: theme.borderRadius.sm,
            fontSize: '12px',
            color: theme.colors.textMuted,
            fontFamily: "monospace",
          }}
        >
          <strong>Last Request ID:</strong> {lastRequestId}
        </div>
      )}

      {response && (
        <div
          style={{
            marginTop: theme.spacing.lg,
            padding: theme.spacing.md,
            background: response.duplicate ? 'rgba(255, 136, 0, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            border: `1px solid ${response.duplicate ? theme.colors.warning : theme.colors.primary}`,
            borderRadius: theme.borderRadius.md,
            boxShadow: response.duplicate ? theme.glow.orange : theme.glow.green,
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: theme.spacing.sm, color: theme.colors.text }}>
            {response.duplicate ? "⚠️ Duplicate Detected" : "✅ Order Accepted"}
          </div>
          <pre
            style={{
              fontSize: '12px',
              fontFamily: 'monospace',
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: theme.colors.textMuted,
            }}
          >
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: theme.spacing.lg,
            padding: theme.spacing.md,
            background: 'rgba(255, 68, 68, 0.2)',
            border: `1px solid ${theme.colors.danger}`,
            borderRadius: theme.borderRadius.md,
            color: theme.colors.text,
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: theme.glow.red,
          }}
        >
          ❌ {error}
        </div>
      )}
    </Card>
  );
}
