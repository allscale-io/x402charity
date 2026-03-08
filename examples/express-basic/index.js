const express = require('express');

// Import the x402charity Express middleware
// This automatically triggers a micro-donation on every matched request
let x402charityMiddleware;
try {
  const { x402charity } = require('x402charity/express');
  x402charityMiddleware = x402charity;
} catch {
  // Fallback: log a warning if x402charity is not installed
  console.warn('[x402charity] Package not found. Running in demo mode (no real donations).');
  x402charityMiddleware = () => (_req, _res, next) => next();
}

const app = express();
const PORT = process.env.PORT || 3000;

// ─── x402charity middleware ───────────────────────────────────────
// Every request to /api/* will trigger a micro-donation.
// The donation happens asynchronously and does NOT block the response.
app.use(
  '/api',
  x402charityMiddleware({
    charityId: process.env.CHARITY_ID || 'testing-charity',
    network: process.env.NETWORK || 'base-sepolia',
    amount: process.env.DONATION_AMOUNT || '$0.001',
    silent: false, // Log donation results to console
    serverUrl: process.env.X402_SERVER_URL || 'http://localhost:3402',
  })
);

// ─── Routes ──────────────────────────────────────────────────────

app.get('/', (_req, res) => {
  res.json({
    message: 'x402charity Express Example',
    description: 'Every API call triggers a micro-donation via x402',
    routes: {
      'GET /': 'This help message (no donation)',
      'GET /api/hello': 'Hello world (triggers donation)',
      'GET /api/time': 'Current time (triggers donation)',
      'GET /api/health': 'Health check (triggers donation)',
    },
  });
});

app.get('/api/hello', (_req, res) => {
  res.json({ message: 'Hello! A micro-donation was just made on your behalf 💝' });
});

app.get('/api/time', (_req, res) => {
  res.json({ time: new Date().toISOString(), donated: true });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ─── Start ───────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`
  🚀 x402charity Express Example running on http://localhost:${PORT}

  Try these endpoints:
    GET http://localhost:${PORT}/           → Help (no donation)
    GET http://localhost:${PORT}/api/hello  → Hello + donation
    GET http://localhost:${PORT}/api/time   → Time + donation
    GET http://localhost:${PORT}/api/health → Health + donation

  Every /api/* request triggers a $0.001 USDC donation 💝
  `);
});
