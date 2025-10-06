"use client";
import { useState } from "react";
import { TrendingUp, Check, AlertCircle, Loader2, ChevronDown } from "lucide-react";
import { Card, Button } from "./ui";
import { theme } from "../styles/theme";
import ConfirmDialog from "./ConfirmDialog";
import { addOrderToHistory } from "./OrderHistory";

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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

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

    const order: Order = {
      symbol: symbol.trim().toUpperCase(),
      side,
      qty,
      type: orderType,
    };

    if (orderType === "limit") {
      order.limitPrice = parseFloat(limitPrice);
    }

    // Show confirmation dialog
    setPendingOrder(order);
    setShowConfirmDialog(true);
  };

  const executeOrder = async () => {
    if (!pendingOrder) return;

    setShowConfirmDialog(false);
    setLoading(true);
    setError(null);
    setResponse(null);

    const requestId = generateRequestId();
    setLastRequestId(requestId);

    const body = {
      dryRun: true, // Always dry-run for now
      requestId,
      orders: [pendingOrder],
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

      // Add to order history
      addOrderToHistory({
        symbol: pendingOrder.symbol,
        side: pendingOrder.side,
        qty: pendingOrder.qty,
        type: pendingOrder.type,
        limitPrice: pendingOrder.limitPrice,
        status: data.accepted ? "dry-run" : "cancelled",
        dryRun: true,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setPendingOrder(null);
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

  const getConfirmMessage = () => {
    if (!pendingOrder) return "";
    const priceStr =
      pendingOrder.type === "limit" && pendingOrder.limitPrice
        ? ` at $${pendingOrder.limitPrice.toFixed(2)}`
        : " at market price";
    return `${pendingOrder.side.toUpperCase()} ${pendingOrder.qty} shares of ${pendingOrder.symbol}${priceStr}?`;
  };

  return (
    <>
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Confirm Order"
        message={getConfirmMessage()}
        confirmText="Execute Order"
        cancelText="Cancel"
        confirmVariant={pendingOrder?.side === "sell" ? "danger" : "primary"}
        onConfirm={executeOrder}
        onCancel={() => {
          setShowConfirmDialog(false);
          setPendingOrder(null);
        }}
      />

      <div style={{ padding: theme.spacing.lg }}>
        <Card glow="green">
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.md,
            marginBottom: theme.spacing.xl
          }}>
            <div style={{
              padding: theme.spacing.md,
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: theme.borderRadius.lg,
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <TrendingUp style={{ width: 32, height: 32, color: theme.colors.primary }} />
            </div>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: '700',
                color: theme.colors.text
              }}>
                Execute Trade
              </h1>
              <p style={{
                margin: 0,
                marginTop: '4px',
                color: theme.colors.textMuted,
                fontSize: '14px'
              }}>
                Place orders with dry-run mode enabled
              </p>
            </div>
          </div>

          {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Symbol */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: theme.colors.textMuted,
                    marginBottom: theme.spacing.sm
                  }}>
                    Symbol
                  </label>
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder="SPY, AAPL, QQQ..."
                    disabled={loading}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: theme.background.input,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.md,
                      color: theme.colors.text,
                      fontSize: '14px',
                      transition: theme.transitions.normal,
                      opacity: loading ? 0.5 : 1
                    }}
                  />
                </div>

                {/* Side */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: theme.colors.textMuted,
                    marginBottom: theme.spacing.sm
                  }}>
                    Side
                  </label>
                  <select
                    value={side}
                    onChange={(e) => setSide(e.target.value as "buy" | "sell")}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: theme.background.input,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.md,
                      color: theme.colors.text,
                      fontSize: '14px',
                      transition: theme.transitions.normal,
                      opacity: loading ? 0.5 : 1
                    }}
                  >
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: theme.colors.textMuted,
                    marginBottom: theme.spacing.sm
                  }}>
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(parseInt(e.target.value) || 0)}
                    min="1"
                    step="1"
                    disabled={loading}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: theme.background.input,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.md,
                      color: theme.colors.text,
                      fontSize: '14px',
                      transition: theme.transitions.normal,
                      opacity: loading ? 0.5 : 1
                    }}
                  />
                </div>

                {/* Order Type */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: theme.colors.textMuted,
                    marginBottom: theme.spacing.sm
                  }}>
                    Order Type
                  </label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value as "market" | "limit")}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: theme.background.input,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.md,
                      color: theme.colors.text,
                      fontSize: '14px',
                      transition: theme.transitions.normal,
                      opacity: loading ? 0.5 : 1
                    }}
                  >
                    <option value="market">Market</option>
                    <option value="limit">Limit</option>
                  </select>
                </div>

                {/* Limit Price (conditional) */}
                {orderType === "limit" && (
                  <div className="md:col-span-2">
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: theme.colors.textMuted,
                      marginBottom: theme.spacing.sm
                    }}>
                      Limit Price
                    </label>
                    <input
                      type="number"
                      value={limitPrice}
                      onChange={(e) => setLimitPrice(e.target.value)}
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      disabled={loading}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: theme.background.input,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.borderRadius.md,
                        color: theme.colors.text,
                        fontSize: '14px',
                        transition: theme.transitions.normal,
                        opacity: loading ? 0.5 : 1
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: theme.spacing.md, marginTop: theme.spacing.lg }}>
                <Button type="submit" loading={loading} variant="primary" style={{ flex: 1 }}>
                  {loading ? 'Processing...' : 'Submit Order (Dry-Run)'}
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

            {/* Last Request ID */}
            {lastRequestId && (
              <div style={{
                marginTop: theme.spacing.lg,
                padding: theme.spacing.md,
                background: theme.background.input,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.sm,
                fontSize: '12px',
                color: theme.colors.textMuted,
                fontFamily: 'monospace'
              }}>
                <strong>Last Request ID:</strong> {lastRequestId}
              </div>
            )}

            {/* Success Response */}
            {response && !error && (
              <div style={{ marginTop: theme.spacing.lg }}>
                <div style={{
                  padding: theme.spacing.lg,
                  background: response.duplicate ? 'rgba(255, 136, 0, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  border: `2px solid ${response.duplicate ? theme.colors.warning : theme.colors.primary}`,
                  borderRadius: theme.borderRadius.md,
                  boxShadow: response.duplicate ? theme.glow.orange : theme.glow.green,
                  marginBottom: theme.spacing.md
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md }}>
                    <div style={{
                      padding: theme.spacing.sm,
                      background: response.duplicate ? 'rgba(255, 136, 0, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      borderRadius: theme.borderRadius.sm
                    }}>
                      {response.duplicate ? (
                        <AlertCircle style={{ width: 24, height: 24, color: theme.colors.warning }} />
                      ) : (
                        <Check style={{ width: 24, height: 24, color: theme.colors.primary }} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: response.duplicate ? theme.colors.warning : theme.colors.primary,
                        marginBottom: theme.spacing.sm
                      }}>
                        {response.duplicate ? "⚠️ Duplicate Detected" : "✅ Order Accepted"}
                      </h3>
                      <div style={{ fontSize: '14px', color: theme.colors.textMuted }}>
                        <p style={{ marginBottom: theme.spacing.xs }}>
                          <strong>Status:</strong> {response.accepted ? "Accepted" : "Rejected"}
                        </p>
                        {response.dryRun && (
                          <p><strong>Mode:</strong> <span style={{ color: theme.colors.info }}>Dry Run</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowRawJson(!showRawJson)}
                  style={{
                    width: '100%',
                    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                    background: theme.background.input,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.md,
                    color: theme.colors.textMuted,
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: theme.transitions.normal,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>View Raw Response</span>
                  <ChevronDown style={{
                    width: 20,
                    height: 20,
                    transform: showRawJson ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: theme.transitions.normal
                  }} />
                </button>

                {showRawJson && (
                  <div style={{
                    marginTop: theme.spacing.md,
                    padding: theme.spacing.md,
                    background: theme.background.input,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.md,
                    overflowX: 'auto'
                  }}>
                    <pre style={{
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      color: theme.colors.textMuted
                    }}>
                      {JSON.stringify(response, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div style={{
                marginTop: theme.spacing.lg,
                padding: theme.spacing.lg,
                background: 'rgba(255, 68, 68, 0.2)',
                border: `2px solid ${theme.colors.danger}`,
                borderRadius: theme.borderRadius.md,
                boxShadow: theme.glow.red
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md }}>
                  <div style={{
                    padding: theme.spacing.sm,
                    background: 'rgba(255, 68, 68, 0.2)',
                    borderRadius: theme.borderRadius.sm
                  }}>
                    <AlertCircle style={{ width: 24, height: 24, color: theme.colors.danger }} />
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: theme.colors.danger,
                      marginBottom: theme.spacing.sm
                    }}>
                      ❌ Error
                    </h3>
                    <p style={{ fontSize: '14px', color: theme.colors.text, margin: 0 }}>
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}
        </Card>
      </div>
    </>
  );
}
