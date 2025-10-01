import StatusBar from "../components/StatusBar";
import ExecuteTradeForm from "../components/ExecuteTradeForm";
import PositionsTable from "../components/PositionsTable";
import MorningRoutine from "../components/MorningRoutine";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "24px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        backgroundColor: "#f9fafb",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "2.5rem",
              marginBottom: "8px",
              color: "#111827",
              fontWeight: "700",
            }}
          >
            AI Trader
          </h1>
          <p
            style={{
              fontSize: "1.1rem",
              color: "#6b7280",
              marginBottom: "0",
            }}
          >
            Production-ready trading platform with secure cloud backend
          </p>
        </div>

        {/* Status Bar */}
        <StatusBar />

        {/* Main Content Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "24px",
            marginBottom: "32px",
          }}
        >
          <ExecuteTradeForm />
          <PositionsTable />
          <MorningRoutine />
        </div>

        {/* Features Card */}
        <div
          style={{
            padding: "24px",
            backgroundColor: "white",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <h3 style={{ margin: "0 0 16px 0", color: "#111827", fontSize: "18px" }}>
            🚀 Production Features
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "12px",
            }}
          >
            <FeatureItem
              icon="🔒"
              title="Secure Proxy"
              description="All API calls routed server-side, no token exposure"
            />
            <FeatureItem
              icon="🔁"
              title="Idempotency"
              description="Duplicate protection with 600s TTL"
            />
            <FeatureItem
              icon="🛑"
              title="Kill Switch"
              description="Emergency halt for all live trading"
            />
            <FeatureItem
              icon="✅"
              title="Dry-Run Mode"
              description="Test orders safely before going live"
            />
            <FeatureItem
              icon="🌐"
              title="Cloud Native"
              description="Deployed on Vercel (frontend) + Render (backend)"
            />
            <FeatureItem
              icon="⚡"
              title="Real-time Health"
              description="Live status monitoring with auto-refresh"
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "48px",
            padding: "16px",
            textAlign: "center",
            color: "#9ca3af",
            fontSize: "13px",
          }}
        >
          <p style={{ margin: 0 }}>
            Frontend:{" "}
            <a
              href="https://ai-trader-snowy.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#3b82f6", textDecoration: "none" }}
            >
              Vercel
            </a>
            {" | "}
            Backend:{" "}
            <a
              href="https://ai-trader-86a1.onrender.com/api/health"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#3b82f6", textDecoration: "none" }}
            >
              Render
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        padding: "12px",
        backgroundColor: "#f9fafb",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
      }}
    >
      <div style={{ fontSize: "24px", marginBottom: "8px" }}>{icon}</div>
      <div style={{ fontWeight: "600", fontSize: "14px", color: "#111827", marginBottom: "4px" }}>
        {title}
      </div>
      <div style={{ fontSize: "13px", color: "#6b7280", lineHeight: "1.4" }}>{description}</div>
    </div>
  );
}
