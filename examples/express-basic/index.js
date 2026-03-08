import express from 'express';
import { x402Middleware } from 'x402charity/express';

const app = express();
const PORT = process.env.PORT || 3000;

// Use x402charity middleware to automatically donate on API routes
app.use(x402Middleware({
  // Use Base Sepolia testnet for the example
  chainId: 84532,
  // The charity endpoint - will prompt for optional donation
  x402Endpoint: 'https://x402charity.com/donate'
}));

// Example API endpoint
app.get('/api/hello', (req, res) => {
  res.json({ 
    message: 'Hello! This is a demo of x402charity middleware.',
    note: 'This endpoint can accept optional micro-donations via HTTP 402'
  });
});

// Another example endpoint
app.get('/api/data', (req, res) => {
  res.json({
    data: ['item1', 'item2', 'item3'],
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Try: curl -H "Accept: application/json" http://localhost:${PORT}/api/hello`);
});
