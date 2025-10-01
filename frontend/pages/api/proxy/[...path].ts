import type { NextApiRequest, NextApiResponse } from "next";

const BACKEND = process.env.BACKEND_API_BASE_URL!;
const API_TOKEN = process.env.API_TOKEN!;

// Exact endpoints our UI uses
const ALLOW_GET = new Set<string>([
  "api/health",
  "api/settings",
  "api/portfolio/positions",
]);

const ALLOW_POST = new Set<string>([
  "api/trading/execute",
  "api/settings",
  "api/admin/kill",
]);

function isAllowedOrigin(req: NextApiRequest) {
  const origin = (req.headers.origin || "").toLowerCase();
  const prod = (process.env.PUBLIC_SITE_ORIGIN || "").toLowerCase();
  const preview = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}`.toLowerCase() : "";
  // Permit prod + current preview; if Origin missing (same-origin fetch), allow.
  return !origin || origin === prod || (!!preview && origin === preview);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("access-control-allow-origin", req.headers.origin ?? "");
    res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
    res.setHeader("access-control-allow-headers", "content-type,x-request-id");
    res.status(204).end();
    return;
  }

  if (!isAllowedOrigin(req)) {
    res.status(403).json({ error: "Forbidden (origin)" });
    return;
  }

  const parts = (req.query.path as string[]) || [];
  const path = parts.join("/");

  if (req.method === "GET" && !ALLOW_GET.has(path)) {
    return res.status(405).json({ error: "Not allowed" });
  }
  if (req.method === "POST" && !ALLOW_POST.has(path)) {
    return res.status(405).json({ error: "Not allowed" });
  }

  const url = `${BACKEND}/${path}`;
  const headers: Record<string, string> = {
    authorization: `Bearer ${API_TOKEN}`,
    "content-type": "application/json",
  };

  // propagate request id if client set one
  const rid = (req.headers["x-request-id"] as string) || "";
  if (rid) headers["x-request-id"] = rid;

  try {
    const upstream = await fetch(url, {
      method: req.method,
      headers,
      body: req.method === "POST" ? JSON.stringify(req.body ?? {}) : undefined,
      // avoid any CDN caching at the edge
      cache: "no-store",
    });

    const text = await upstream.text();
    res
      .status(upstream.status)
      .setHeader("content-type", upstream.headers.get("content-type") || "application/json")
      .setHeader("cache-control", "no-store")
      .send(text);
  } catch (err) {
    res.status(502).json({ error: "Upstream error", detail: String(err) });
  }
}
