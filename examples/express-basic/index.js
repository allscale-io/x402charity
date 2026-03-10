import express from 'express';
import { x402charity } from '@x402charity/middleware-express';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize x402charity middleware for Base Sepolia testnet
app.use(x402charity({
  network: 'base-sepolia',
  charity: 'testing-charity',
  amount: '0.001', // Amount to donate per API request
  wallet: process.env.WALLET_PRIVATE_KEY // Optional: if you want to auto-donate from a specific wallet
}));

// Example API route that triggers a donation
app.get('/api/donate', (req, res) => {
  res.json({
    success: true,
    message: 'Donation processed successfully',
    transaction: req.x402charityTransaction
  });
});

// Example public route (no donation required)
app.get('/', (req, res) => {
  res.send(`
    <h1>x402charity Express Example</h1>
    <p>Visit <a href="/api/donate">/api/donate</a> to trigger a test donation on Base Sepolia</p>
    <p>Check the transaction hash in the response to verify on BaseScan</p>
  `);
});

app.listen(PORT, () => {
  console.log(`Example app running on http://localhost:${PORT}`);
  console.log('Test the donation endpoint at http://localhost:3000/api/donate');
});
