"use client";
import { useState, useEffect } from "react";
import { Card } from "./ui";
import { theme } from "../styles/theme";

interface OrderRecord {
  id: string;
  timestamp: string;
  symbol: string;
  side: "buy" | "sell";
  qty: number;
  type: "market" | "limit";
  limitPrice?: number;
  status: "executed" | "pending" | "cancelled" | "dry-run";
  dryRun: boolean;
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [filter, setFilter] = useState<"all" | "executed" | "dry-run">("all");

  // Load orders from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("orderHistory");
    if (stored) {
      try {
        setOrders(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load order history:", e);
      }
    }
  }, []);

  // Save orders to localStorage whenever they change
  useEffect(() => {
    if (orders.length > 0) {
      localStorage.setItem("orderHistory", JSON.stringify(orders));
    }
  }, [orders]);

  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true;
    if (filter === "dry-run") return order.dryRun;
    if (filter === "executed") return order.status === "executed" && !order.dryRun;
    return true;
  });

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear all order history?")) {
      setOrders([]);
      localStorage.removeItem("orderHistory");
    }
  };

  const getSideColor = (side: string) => {
    return side === "buy" ? theme.colors.primary : theme.colors.danger;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "executed":
        return theme.colors.primary;
      case "pending":
        return theme.colors.warning;
      case "cancelled":
        return theme.colors.textMuted;
      case "dry-run":
        return theme.colors.info;
      default:
        return theme.colors.textMuted;
    }
  };

  return (
    <div style={{ padding: theme.spacing.lg }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: theme.spacing.lg,
        }}
      >
        <h2
          style={{
            color: theme.colors.text,
            fontSize: "28px",
            fontWeight: "700",
          }}
        >
          Order History
        </h2>

        <button
          onClick={clearHistory}
          style={{
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            background: theme.background.card,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.md,
            color: theme.colors.danger,
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            transition: theme.transitions.normal,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = theme.background.cardHover;
            e.currentTarget.style.borderColor = theme.colors.danger;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = theme.background.card;
            e.currentTarget.style.borderColor = theme.colors.border;
          }}
        >
          Clear History
        </button>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: "flex",
          gap: theme.spacing.sm,
          marginBottom: theme.spacing.lg,
        }}
      >
        {(["all", "executed", "dry-run"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              background:
                filter === f ? theme.colors.primary : theme.background.card,
              border: `1px solid ${
                filter === f ? theme.colors.primary : theme.colors.border
              }`,
              borderRadius: theme.borderRadius.md,
              color: filter === f ? "white" : theme.colors.textMuted,
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: theme.transitions.normal,
              textTransform: "capitalize",
            }}
            onMouseEnter={(e) => {
              if (filter !== f) {
                e.currentTarget.style.background = theme.background.cardHover;
                e.currentTarget.style.borderColor = theme.colors.borderHover;
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== f) {
                e.currentTarget.style.background = theme.background.card;
                e.currentTarget.style.borderColor = theme.colors.border;
              }
            }}
          >
            {f.replace("-", " ")}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <div
            style={{
              textAlign: "center",
              padding: theme.spacing.xl,
              color: theme.colors.textMuted,
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: theme.spacing.md }}>
              📋
            </div>
            <p style={{ fontSize: "18px" }}>
              No orders found
              {filter !== "all" && ` in ${filter} category`}
            </p>
          </div>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: theme.spacing.md }}>
          {filteredOrders.map((order) => (
            <Card key={order.id}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: theme.spacing.md,
                }}
              >
                {/* Left side - Order details */}
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: theme.spacing.sm,
                      marginBottom: theme.spacing.sm,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "20px",
                        fontWeight: "700",
                        color: theme.colors.text,
                      }}
                    >
                      {order.symbol}
                    </span>
                    <span
                      style={{
                        padding: `2px ${theme.spacing.sm}`,
                        background: getSideColor(order.side),
                        color: "white",
                        fontSize: "12px",
                        fontWeight: "700",
                        borderRadius: theme.borderRadius.sm,
                        textTransform: "uppercase",
                      }}
                    >
                      {order.side}
                    </span>
                    {order.dryRun && (
                      <span
                        style={{
                          padding: `2px ${theme.spacing.sm}`,
                          background: theme.colors.info,
                          color: "white",
                          fontSize: "12px",
                          fontWeight: "700",
                          borderRadius: theme.borderRadius.sm,
                        }}
                      >
                        DRY RUN
                      </span>
                    )}
                  </div>

                  <div style={{ color: theme.colors.textMuted, fontSize: "14px" }}>
                    <div>
                      Qty: <strong style={{ color: theme.colors.text }}>{order.qty}</strong>
                    </div>
                    <div style={{ textTransform: "capitalize" }}>
                      Type: <strong style={{ color: theme.colors.text }}>{order.type}</strong>
                      {order.type === "limit" && order.limitPrice && (
                        <span> @ ${order.limitPrice.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side - Status and timestamp */}
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      color: getStatusColor(order.status),
                      fontSize: "14px",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      marginBottom: theme.spacing.xs,
                    }}
                  >
                    {order.status}
                  </div>
                  <div
                    style={{
                      color: theme.colors.textMuted,
                      fontSize: "12px",
                    }}
                  >
                    {new Date(order.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Export helper function to add orders to history
export function addOrderToHistory(order: Omit<OrderRecord, "id" | "timestamp">) {
  const orderRecord: OrderRecord = {
    ...order,
    id: `order-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    timestamp: new Date().toISOString(),
  };

  const stored = localStorage.getItem("orderHistory");
  const orders: OrderRecord[] = stored ? JSON.parse(stored) : [];
  orders.unshift(orderRecord); // Add to beginning

  // Keep only last 100 orders
  if (orders.length > 100) {
    orders.splice(100);
  }

  localStorage.setItem("orderHistory", JSON.stringify(orders));

  // Dispatch custom event to notify OrderHistory component
  window.dispatchEvent(new CustomEvent("orderHistoryUpdated"));
}
