import type { NextApiRequest, NextApiResponse } from "next";

const BACKEND = process.env.BACKEND_API_BASE_URL || 'http://localhost:8000';
const API_TOKEN = process.env.API_TOKEN!;

// Exact endpoints our UI uses (paths without /api prefix - added in URL construction)
const ALLOW_GET = new Set<string>([
  "health",
  "settings",
  "portfolio/positions",
  "ai/recommendations",
  "market/historical",
  "screening/opportunities",
  "screening/strategies",
  "market/conditions",
  "market/indices",
  "market/sectors",
  // Live market data endpoints
  "market/quote",
  "market/quotes",
  "market/scanner/under4",
  "market/bars",
  // News endpoints
  "news/providers",
  "news/company",
  "news/market",
  // Alpaca endpoints
  "account",
  "positions",
  "orders",
  "assets",
  "clock",
  "calendar",
  "watchlists",
]);

const ALLOW_POST = new Set<string>([
  "trading/execute",
  "settings",
  "admin/kill",
  // Alpaca endpoints
  "orders",
  "watchlists",
]);

const ALLOW_DELETE = new Set<string>([
  // Alpaca endpoints
  "positions",
  "orders",
  "watchlists",
]);

function isAllowedOrigin(req: NextApiRequest) {
  const origin = (req.headers.origin || "").toLowerCase();
  const prod = (process.env.PUBLIC_SITE_ORIGIN || "").toLowerCase();
  const preview = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}`.toLowerCase() : "";

  // Allow localhost for development
  const isLocalhost = origin.includes("localhost") || origin.includes("127.0.0.1");

  // Permit prod + current preview + localhost; if Origin missing (same-origin fetch), allow.
  return !origin || origin === prod || (!!preview && origin === preview) || isLocalhost;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("access-control-allow-origin", req.headers.origin ?? "");
    res.setHeader("access-control-allow-methods", "GET,POST,DELETE,OPTIONS");
    res.setHeader("access-control-allow-headers", "content-type,x-request-id");
    res.status(204).end();
    return;
  }

  if (!isAllowedOrigin(req)) {
    res.status(403).json({ error: "Forbidden (origin)" });
    return;
  }

  const parts = (req.query.path as string[]) || [];
  let path = parts.join("/");

  // Handle legacy URLs with /api/ prefix (e.g., /api/proxy/api/health)
  // Strip leading "api/" if present
  if (path.startsWith("api/")) {
    path = path.substring(4);
  }

  // Check if path is allowed based on method
  if (req.method === "GET" && !ALLOW_GET.has(path)) {
    // Allow wildcard patterns for dynamic routes
    const isAllowedPattern = Array.from(ALLOW_GET).some(allowed =>
      path.startsWith(allowed + "/") || path === allowed
    );
    if (!isAllowedPattern) {
      return res.status(405).json({ error: "Not allowed" });
    }
  }
  if (req.method === "POST" && !ALLOW_POST.has(path)) {
    const isAllowedPattern = Array.from(ALLOW_POST).some(allowed =>
      path.startsWith(allowed + "/") || path === allowed
    );
    if (!isAllowedPattern) {
      return res.status(405).json({ error: "Not allowed" });
    }
  }
  if (req.method === "DELETE" && !ALLOW_DELETE.has(path)) {
    const isAllowedPattern = Array.from(ALLOW_DELETE).some(allowed =>
      path.startsWith(allowed + "/") || path === allowed
    );
    if (!isAllowedPattern) {
      return res.status(405).json({ error: "Not allowed" });
    }
  }

  const url = `${BACKEND}/api/${path}`;
  const headers: Record<string, string> = {
    authorization: `Bearer ${API_TOKEN}`,
    "content-type": "application/json",
  };

  // propagate request id if client set one
  const rid = (req.headers["x-request-id"] as string) || "";
  if (rid) headers["x-request-id"] = rid;

  // Enhanced debug logging
  console.log(`\n[PROXY] ====== New Request ======`);
  console.log(`[PROXY] Method: ${req.method}`);
  console.log(`[PROXY] Original URL: ${req.url}`);
  console.log(`[PROXY] Extracted path: "${path}"`);
  console.log(`[PROXY] Constructed URL: ${url}`);
  console.log(`[PROXY] Auth header: Bearer ${API_TOKEN?.substring(0, 8)}...`);
  console.log(`[PROXY] Backend: ${BACKEND}`);
  if (req.method === "POST") {
    console.log(`[PROXY] Body:`, JSON.stringify(req.body, null, 2));
  }

  try {
    const upstream = await fetch(url, {
      method: req.method,
      headers,
      body: (req.method === "POST" || req.method === "DELETE") ? JSON.stringify(req.body ?? {}) : undefined,
      // avoid any CDN caching at the edge
      cache: "no-store",
    });

    const text = await upstream.text();
    console.log(`[PROXY] Response status: ${upstream.status}`);
    console.log(`[PROXY] Response body: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
    console.log(`[PROXY] ====== End Request ======\n`);

    res
      .status(upstream.status)
      .setHeader("content-type", upstream.headers.get("content-type") || "application/json")
      .setHeader("cache-control", "no-store")
      .send(text);
  } catch (err) {
    console.error(`[PROXY] ERROR: ${err}`);
    console.error(`[PROXY] Error details:`, err);
    console.log(`[PROXY] ====== End Request (ERROR) ======\n`);
    res.status(502).json({ error: "Upstream error", detail: String(err) });
  }
}
