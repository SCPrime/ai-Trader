"use client";
import { useState } from "react";
import { TrendingUp, Check, AlertCircle, Loader2, ChevronDown } from "lucide-react";
import { Card } from "./ui";
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
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Symbol */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Symbol
                  </label>
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder="SPY, AAPL, QQQ..."
                    disabled={loading}
                    required
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all disabled:opacity-50"
                  />
                </div>

                {/* Side */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Side
                  </label>
                  <select
                    value={side}
                    onChange={(e) => setSide(e.target.value as "buy" | "sell")}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all disabled:opacity-50"
                  >
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
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
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all disabled:opacity-50"
                  />
                </div>

                {/* Order Type */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Order Type
                  </label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value as "market" | "limit")}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all disabled:opacity-50"
                  >
                    <option value="market">Market</option>
                    <option value="limit">Limit</option>
                  </select>
                </div>

                {/* Limit Price (conditional) */}
                {orderType === "limit" && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
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
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all disabled:opacity-50"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-5 h-5" />
                      Submit Order (Dry-Run)
                    </>
                  )}
                </button>

                {lastRequestId && (
                  <button
                    type="button"
                    onClick={testDuplicate}
                    disabled={loading}
                    className="px-6 py-3 bg-slate-700/50 border border-slate-600/50 text-slate-300 font-semibold rounded-xl hover:bg-slate-700 hover:border-slate-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Test Duplicate
                  </button>
                )}
              </div>
            </form>

            {/* Last Request ID */}
            {lastRequestId && (
              <div className="mt-6 p-4 bg-slate-900/50 border border-slate-700/50 rounded-xl">
                <p className="text-xs text-slate-400 font-mono">
                  <span className="font-semibold">Last Request ID:</span> {lastRequestId}
                </p>
              </div>
            )}

            {/* Success Response */}
            {response && !error && (
              <div className="mt-6 space-y-4">
                <div
                  className={`p-6 rounded-xl border-2 ${
                    response.duplicate
                      ? "bg-amber-500/10 border-amber-500/30"
                      : "bg-teal-500/10 border-teal-500/30"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2 rounded-lg ${
                        response.duplicate ? "bg-amber-500/20" : "bg-teal-500/20"
                      }`}
                    >
                      {response.duplicate ? (
                        <AlertCircle className="w-6 h-6 text-amber-400" />
                      ) : (
                        <Check className="w-6 h-6 text-teal-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3
                        className={`text-lg font-bold mb-2 ${
                          response.duplicate ? "text-amber-400" : "text-teal-400"
                        }`}
                      >
                        {response.duplicate ? "Duplicate Detected" : "Order Accepted"}
                      </h3>
                      <div className="space-y-2 text-sm text-slate-300">
                        <p>
                          <span className="text-slate-400">Status:</span>{" "}
                          <span className="font-semibold">
                            {response.accepted ? "Accepted" : "Rejected"}
                          </span>
                        </p>
                        {response.dryRun && (
                          <p>
                            <span className="text-slate-400">Mode:</span>{" "}
                            <span className="font-semibold text-cyan-400">Dry Run</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Collapsible Raw JSON */}
                <button
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-slate-300 font-medium hover:bg-slate-900 transition-all flex items-center justify-between"
                >
                  <span>View Raw Response</span>
                  <ChevronDown
                    className={`w-5 h-5 transition-transform ${
                      showRawJson ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showRawJson && (
                  <div className="p-4 bg-slate-950/50 border border-slate-700/50 rounded-xl overflow-auto">
                    <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap">
                      {JSON.stringify(response, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mt-6 p-6 bg-red-500/10 border-2 border-red-500/30 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-red-400 mb-2">Error</h3>
                    <p className="text-sm text-slate-300">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
