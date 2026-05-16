# Express Basic Example for x402charity

A minimal Express application demonstrating how to use the x402charity Express middleware to automatically donate on API routes.

## Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- Optional: Wallet private key for Base Sepolia if you want to test actual donations

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. (Optional) Create a `.env` file with your wallet private key if you want to test actual donations:
```env
WALLET_PRIVATE_KEY=your_private_key_here
```

## Run the example

```bash
pnpm start
```

The app will start on `http://localhost:3000`

## Test the functionality

1. Visit the home page: `http://localhost:3000`
2. Test the donation endpoint: `http://localhost:3000/api/donate`

If you provided a wallet private key, you'll see a transaction hash in the response that you can verify on [Base Sepolia Explorer](https://sepolia.basescan.org/).

## How it works

The x402charity middleware is added to the Express app and configured for the Base Sepolia testnet. Any requests to `/api/donate` will automatically trigger a small donation to the configured charity.

This example uses the `testing-charity` address for demonstration purposes. In production, you would replace this with the ID of the actual charity you want to support from the x402charity registry.
