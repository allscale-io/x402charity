# Express Basic Example

This example shows how to use the x402charity middleware in a basic Express application.

## Features

- Automatically donates $0.001 USDC to UNICEF on every `/api/*` request
- Works with both Base mainnet and Base Sepolia testnet
- Simple, minimal setup

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set environment variables (optional)

```bash
export DONATE_API_KEY="your-api-key-here"
export PORT="3000"
```

### 3. Run the server

```bash
node index.js
```

### 4. Test the endpoint

```bash
# Visit the public route (no donation)
curl http://localhost:3000

# Visit the API route (triggers donation)
curl http://localhost:3000/api/hello
```

## Configuration

You can customize the donation behavior in `index.js`:

```javascript
const donationMiddleware = x402charity({
  charity: 'unicef', // Charity ID from the registry
  amount: '$0.001', // Amount to donate per request
  matcher: '/api/*', // Route pattern to match
  apiKey: process.env.DONATE_API_KEY, // Your x402 API key
  network: 'base-sepolia', // Use 'base' for mainnet
});
```

## How It Works

1. When a user visits any `/api/*` route, the middleware automatically triggers a USDC donation
2. The donation is sent on-chain via the x402 protocol
3. The user receives a response confirming the donation
4. All transactions are publicly verifiable on Base blockchain

## License

MIT
