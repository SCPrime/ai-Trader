import type { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.BACKEND_API_BASE_URL;
const API_TOKEN = process.env.API_TOKEN;

// Rate limiting (simple in-memory, 60 req/min per IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60;
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

function getClientIp(req: NextApiRequest): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Validate configuration
  if (!BACKEND_URL || !API_TOKEN) {
    console.error('Missing BACKEND_API_BASE_URL or API_TOKEN');
    return res.status(500).json({
      error: 'Proxy not configured',
      message: 'Server configuration error'
    });
  }

  // Rate limiting
  const clientIp = getClientIp(req);
  if (!checkRateLimit(clientIp)) {
    res.setHeader('X-RateLimit-Limit', RATE_LIMIT.toString());
    res.setHeader('X-RateLimit-Remaining', '0');
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.'
    });
  }

  // Build target URL
  const { path } = req.query;
  if (!path || !Array.isArray(path)) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  const targetPath = path.join('/');

  // Path allowlist (security)
  const allowedPaths = [
    'api/health',
    'api/settings',
    'api/positions',
    'api/trading/execute'
  ];

  if (!allowedPaths.some(allowed => targetPath.startsWith(allowed))) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Path not allowed'
    });
  }

  const targetUrl = `${BACKEND_URL}/${targetPath}`;

  try {
    // Forward request to backend
    const backendResponse = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
        'X-Forwarded-For': clientIp,
      },
      body: req.method !== 'GET' && req.method !== 'HEAD'
        ? JSON.stringify(req.body)
        : undefined,
    });

    // Get response body
    const data = await backendResponse.json();

    // Forward response headers
    const requestId = backendResponse.headers.get('x-request-id');
    if (requestId) {
      res.setHeader('x-request-id', requestId);
    }

    // Set cache control
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Rate limit headers
    const record = rateLimitMap.get(clientIp);
    if (record) {
      res.setHeader('X-RateLimit-Limit', RATE_LIMIT.toString());
      res.setHeader('X-RateLimit-Remaining', (RATE_LIMIT - record.count).toString());
      res.setHeader('X-RateLimit-Reset', Math.floor(record.resetAt / 1000).toString());
    }

    // Forward status and body
    return res.status(backendResponse.status).json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(502).json({
      error: 'Backend unreachable',
      message: 'Failed to connect to backend service'
    });
  }
}