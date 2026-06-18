# x402charity Express Basic Example

A minimal Express app demonstrating the x402charity middleware for automatic micro-donations.

Every HTTP request to this server automatically triggers a $0.001 USDC donation to a charity via the [x402 protocol](https://x402.org).

## Quick Start

```bash
# Install dependencies
npm install

# Set your private key (Base Sepolia testnet wallet with USDC)
export PRIVATE_KEY=0xYOUR_PRIVATE_KEY

# Start the server
npm start
```

## How It Works

1. The Express middleware intercepts every incoming request
2. It calls the x402charity client to initiate a micro-donation ($0.001 USDC)
3. The donation is processed on Base Sepolia (testnet) — no real money is spent during testing
4. The request proceeds normally without blocking

## Routes

| Route | Description |
|-------|-------------|
| `GET /` | Info page with available routes |
| `GET /hello` | Simple greeting (triggers donation) |
| `GET /health` | Health check |

## Configuration

The middleware accepts these options:

```js
x402charity({
  charityId: 'testing-charity', // Charity ID from registry
  network: 'base-sepolia',      // Network (use 'base' for mainnet)
  privateKey: process.env.PRIVATE_KEY, // Wallet private key
  amount: '$0.001',             // Donation amount per request
  silent: false,                // Set true to suppress logs
})
```

## Using in Production

To donate real USDC on Base mainnet:

1. Change `network` to `'base'`
2. Change `charityId` to a verified charity (e.g., `'give-directly'`)
3. Fund your wallet with USDC on Base
