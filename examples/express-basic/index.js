const express = require('express');
const { x402charity } = require('x402charity');

const app = express();
const port = process.env.PORT || 3000;

// Initialize x402charity middleware
const donationMiddleware = x402charity({
  charity: 'unicef',
  amount: '$0.001',
  matcher: '/api/*',
  apiKey: process.env.DONATE_API_KEY || 'your-api-key-here',
  network: 'base-sepolia', // Use 'base' for mainnet
});

// Apply middleware to all /api routes
app.use('/api', donationMiddleware);

// Example API endpoint
app.get('/api/hello', (req, res) => {
  res.json({ 
    message: 'Hello World!',
    donation: 'A $0.001 USDC donation has been sent to UNICEF on your behalf!'
  });
});

// Public route (no donation)
app.get('/', (req, res) => {
  res.send('Welcome to the x402charity Express example! Try visiting /api/hello to trigger a donation.');
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`💸 All /api/* requests will automatically donate $0.001 to UNICEF`);
});
