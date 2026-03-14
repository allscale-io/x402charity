# x402charity Express Basic Example

A simple Express server demonstrating automatic micro-donations using [x402charity](https://github.com/allscale-io/x402charity).

## What This Example Does

This Express app shows how to add automatic USDC donations to any API endpoint. Every time a user makes a POST request to `/api/action` or `/api/trade`, a small donation (default: $0.001) is automatically made to a charity of your choice.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **A deployed x402charity server** - See [deployment instructions](https://github.com/allscale-io/x402charity#deploy-to-vercel)
3. **A funded wallet** - Your donation wallet needs:
   - USDC on Base Sepolia (for donations)
   - A small amount of ETH on Base Sepolia (for gas)

## Quick Start

```bash
# 1. Navigate to the example directory
cd examples/express-basic

# 2. Install dependencies
npm install

# 3. Copy the environment file and configure it
cp .env.example .env

# 4. Edit .env with your configuration
# Required: DONATION_PRIVATE_KEY, DONATE_ENDPOINT, CHARITY_WALLET

# 5. Start the server
npm start
```

## Configuration

Edit the `.env` file with your settings:

| Variable | Required | Description |
|----------|----------|-------------|
| `DONATION_PRIVATE_KEY` | Yes | Private key of wallet funding donations (with `0x` prefix) |
| `DONATE_ENDPOINT` | Yes | Your deployed x402charity server's `/donate` endpoint |
| `CHARITY_WALLET` | Yes | Wallet address of the charity receiving donations |
| `CHARITY_NAME` | No | Display name for the charity (default: "Give Directly") |
| `DONATION_NETWORK` | No | `base` or `base-sepolia` (default: base-sepolia) |
| `DONATION_AMOUNT` | No | Donation per request (default: $0.001) |
| `PORT` | No | Server port (default: 3000) |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/action` | Example action that triggers donation |
| POST | `/api/trade` | Example trade endpoint (e.g., for DEX swaps) |
| GET | `/api/info` | Info endpoint (no donation - GET request) |

## Testing

```bash
# Health check
curl http://localhost:3000/health

# This triggers a donation
curl -X POST http://localhost:3000/api/action

# This also triggers a donation
curl -X POST http://localhost:3000/api/trade

# This does NOT trigger a donation (GET request)
curl http://localhost:3000/api/info
```

## How It Works

1. **Request comes in** → Express processes the request
2. **Middleware fires** → x402charity middleware intercepts POST requests to `/api/*`
3. **Donation triggered** → Middleware calls the x402charity server to make a USDC payment
4. **x402 protocol** → Payment is signed and settled on-chain via Base
5. **Response returned** → Your API response is sent back to the client

The user never needs a wallet or crypto knowledge. Your company funds all donations from a single pre-funded wallet.

## Example Integration

```javascript
const { x402charity } = require('x402charity/express');

app.use('/api', x402charity({
  privateKey: process.env.DONATION_PRIVATE_KEY,
  donateEndpoint: 'https://your-x402charity-server.com/donate',
  charity: {
    id: 'my-charity',
    name: 'My Charity',
    walletAddress: '0x...',
    chain: 'base-sepolia',
    description: 'My charity description',
    verified: false,
    x402Endpoint: 'https://your-x402charity-server.com/donate',
  },
  amount: '$0.001',
  shouldDonate: (req) => req.method === 'POST',
}));
```

## Use Cases

- **DEX/Trading** - $0.001 per swap
- **AI APIs** - $0.001 per API call or prompt
- **Games** - $0.001 per level cleared or match played
- **E-commerce** - $0.01 per order
- **Any product** - Add charitable giving to any user action

## Learn More

- [x402charity GitHub](https://github.com/allscale-io/x402charity)
- [x402 Protocol](https://www.x402.org/)
- [Deploy Your Own Server](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fallscale-io%2Fx402charity)

## License

MIT
