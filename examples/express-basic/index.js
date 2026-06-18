const express = require('express');
const { x402charity } = require('x402charity/express');

const app = express();
const PORT = process.env.PORT || 3000;

// Charity configuration
const charityConfig = {
  privateKey: process.env.DONATION_PRIVATE_KEY,
  donateEndpoint: process.env.DONATE_ENDPOINT || 'https://x402charity.com/donate',
  charity: {
    id: 'testing-charity',
    name: 'Testing Charity',
    walletAddress: '0x8DC1521132381aAB648e067c2Db3677D5BF70c6d',
    chain: 'base-sepolia',
    description: 'Test charity for development and demos',
    verified: false,
    x402Endpoint: 'https://x402charity.com/donate',
  },
  amount: '$0.001',
  shouldDonate: (req) => req.method === 'POST',
};

// Apply x402charity middleware to /api routes
app.use('/api', x402charity(charityConfig));

// Example API endpoint
app.post('/api/purchase', (req, res) => {
  res.json({
    success: true,
    message: 'Purchase completed! A $0.001 donation was triggered.',
    charity: charityConfig.charity.name,
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`馃殌 Express server running at http://localhost:${PORT}`);
  console.log(`馃挐 x402charity middleware active on /api routes`);
  console.log(`馃摑 Try: POST http://localhost:${PORT}/api/purchase`);
});