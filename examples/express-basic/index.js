/**
 * Express Basic Example - x402charity Integration
 * 
 * This example demonstrates how to add automatic micro-donations
 * to your Express server using x402charity middleware.
 * 
 * Run: npm install && npm start
 */

import 'dotenv/config';
import express from 'express';
import { x402charity } from 'x402charity/express';

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies
app.use(express.json());

// x402charity middleware configuration
// This will trigger a donation on every POST request to /api/*
const donationMiddleware = x402charity({
  // Your donation wallet private key (without 0x prefix or with 0x)
  privateKey: process.env.DONATION_PRIVATE_KEY,
  
  // The x402-gated donation endpoint (your deployed x402charity server)
  donateEndpoint: process.env.DONATE_ENDPOINT || 'https://your-x402charity-server.com/donate',
  
  // The charity to receive donations
  charity: {
    id: process.env.CHARITY_ID || 'give-directly',
    name: process.env.CHARITY_NAME || 'Give Directly',
    walletAddress: process.env.CHARITY_WALLET || '0x0000000000000000000000000000000000000000',
    chain: process.env.DONATION_NETWORK || 'base-sepolia',
    description: 'Providing direct cash transfers to people in need',
    verified: true,
    x402Endpoint: process.env.DONATE_ENDPOINT || 'https://your-x402charity-server.com/donate',
  },
  
  // Donation amount per request (default: $0.001)
  amount: process.env.DONATION_AMOUNT || '$0.001',
  
  // Only trigger donations on POST requests
  shouldDonate: (req) => req.method === 'POST',
  
  // Set to false to see donation errors in console
  silent: true,
});

// Apply the donation middleware to /api routes
app.use('/api', donationMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Example API endpoint that triggers a donation
app.post('/api/action', (req, res) => {
  // This POST request will trigger a micro-donation to the charity
  res.json({
    success: true,
    message: 'Action completed! A micro-donation was made to charity.',
    // In production, you could return the donation receipt
  });
});

// Another example endpoint - e.g., for processing a trade
app.post('/api/trade', (req, res) => {
  res.json({
    success: true,
    message: 'Trade processed! Thank you for supporting charity.',
  });
});

// Example endpoint without donations (GET request)
app.get('/api/info', (req, res) => {
  res.json({
    message: 'This endpoint does not trigger donations (GET request)',
    charity: process.env.CHARITY_NAME || 'Give Directly',
    amount: process.env.DONATION_AMOUNT || '$0.001',
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`
🚀 x402charity Express Example Server
=======================================

Server running at http://localhost:${PORT}

Endpoints:
  GET  /health         - Health check
  POST /api/action     - Triggers a donation (${process.env.DONATION_AMOUNT || '$0.001'})
  POST /api/trade      - Triggers a donation (e.g., for trades/swaps)
  GET  /api/info       - No donation (GET request)

Configuration:
  Charity: ${process.env.CHARITY_NAME || 'Give Directly'}
  Network: ${process.env.DONATION_NETWORK || 'base-sepolia'}
  Amount:  ${process.env.DONATION_AMOUNT || '$0.001'}

⚠️  Make sure to configure your .env file with:
    - DONATION_PRIVATE_KEY
    - DONATE_ENDPOINT
    - CHARITY_WALLET
`);
});
