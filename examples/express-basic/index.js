import express from 'express';
import { x402charity } from 'x402charity/express';

const app = express();
const port = process.env.PORT || 3000;

// x402charity middleware — auto-donates $0.001 USDC on every API request
// Uses Base Sepolia (testnet) by default for safe testing
app.use(
  x402charity({
    charityId: 'testing-charity',
    network: 'base-sepolia',
    privateKey: process.env.PRIVATE_KEY,
    amount: '$0.001',
    silent: false, // Log donation results for demo visibility
  })
);

// Sample API routes
app.get('/', (req, res) => {
  res.json({
    message: 'x402charity Express example',
    description: 'Every request to this server triggers a micro-donation via x402',
    routes: {
      'GET /': 'This info page',
      'GET /hello': 'A simple greeting (triggers donation)',
      'GET /health': 'Health check',
    },
  });
});

app.get('/hello', (req, res) => {
  res.json({ message: 'Hello! A micro-donation was just made on your behalf.' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.listen(port, () => {
  console.log(`x402charity express example running on http://localhost:${port}`);
  console.log('Every API request triggers a $0.001 USDC donation via x402.');
});
