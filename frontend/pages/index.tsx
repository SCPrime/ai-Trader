import ApiButtons from "../components/ApiButtons";

export default function Home() {
  return (
    <main style={{
      minHeight: "100vh",
      padding: "24px",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h1 style={{
          fontSize: "2.5rem",
          marginBottom: "8px",
          color: "#333"
        }}>
          AI Trader
        </h1>
        <p style={{
          fontSize: "1.1rem",
          color: "#666",
          marginBottom: "32px"
        }}>
          Cloud-ready trading platform with real API endpoints
        </p>

        <ApiButtons />

        <div style={{
          marginTop: "48px",
          padding: "24px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          borderLeft: "4px solid #0070f3"
        }}>
          <h3 style={{ margin: "0 0 16px 0", color: "#333" }}>
            🚀 Production Ready Features
          </h3>
          <ul style={{ margin: 0, paddingLeft: "20px", lineHeight: "1.6" }}>
            <li>✅ <strong>Bearer Token Authentication</strong> - Secure API access</li>
            <li>✅ <strong>Idempotency Protection</strong> - Prevents duplicate orders</li>
            <li>✅ <strong>Kill Switch</strong> - Emergency trading halt</li>
            <li>✅ <strong>Dry Run Mode</strong> - Safe testing environment</li>
            <li>✅ <strong>Real Cloud Deployment</strong> - No localhost dependencies</li>
          </ul>
        </div>
      </div>
    </main>
  );
}