# x402charity Express Example

A minimal Express app that automatically donates to charity on every API call using the x402charity middleware.

## Quick Start

```bash
# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your x402charity server URL

# Start the server
npm start
```

## How It Works

The x402charity Express middleware is added to the `/api` route prefix. Every request to `/api/*` automatically triggers a micro-donation ($0.001 USDC) to the configured charity — without blocking the response.

```js
const { x402charity } = require('x402charity/express');

app.use('/api', x402charity({
  charityId: 'testing-charity',
  network: 'base-sepolia',
  amount: '$0.001',
  silent: false,
  serverUrl: 'http://localhost:3402',
}));
```

## Endpoints

| Route | Description | Triggers Donation? |
|-------|-------------|-------------------|
| `GET /` | Help / route list | ❌ No |
| `GET /api/hello` | Hello world | ✅ Yes |
| `GET /api/time` | Current time | ✅ Yes |
| `GET /api/health` | Health check | ✅ Yes |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `X402_SERVER_URL` | `http://localhost:3402` | Your x402charity server |
| `CHARITY_ID` | `testing-charity` | Charity ID from registry |
| `NETWORK` | `base-sepolia` | `base-sepolia` or `base` |
| `DONATION_AMOUNT` | `$0.001` | Amount per donation |
| `PORT` | `3000` | Server port |

## Prerequisites

You need a running x402charity server. See the [main README](../../README.md) for setup instructions.

## License

MIT
