# x402 Charity

[![GitHub stars](https://img.shields.io/github/stars/allscale-io/x402charity?style=social)](https://github.com/allscale-io/x402charity/stargazers)
[![Fork on GitHub](https://img.shields.io/github/forks/allscale-io/x402charity?style=social)](https://github.com/allscale-io/x402charity/fork)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://x402charity.com)

Open-source micro-donation server powered by the [x402 protocol](https://www.x402.org/) on Base. Deploy your own server, then trigger USDC donations with a single HTTP call from any product.

**[Live Demo](https://x402charity.com)** | **[Star on GitHub](https://github.com/allscale-io/x402charity/stargazers)** | **[Fork this repo](https://github.com/allscale-io/x402charity/fork)**

Built and maintained by [AllScale Lab](https://allscale.io).

## What Is This?

x402 Charity lets any company add micro-donations to their product. Every user action — a trade, an API call, a game action — can trigger a small USDC donation to a charity of your choice.

- No wallet or crypto knowledge needed from your users
- Your company funds the donations from a dedicated wallet
- All donations are on-chain and publicly verifiable
- Built-in dashboard shows donation history and wallet balances

## How It Works

```
User Action  -->  Your Product Server  -->  POST /donate  -->  x402 Charity Server
                                                                    |
                                                              x402 Protocol
                                                                    |
                                                              x402.org Facilitator
                                                                    |
                                                              USDC on-chain
                                                                    |
                                                              Charity Wallet
```

1. A user takes an action in your product (swap, API call, game move, etc.)
2. Your product server calls `POST /donate` on your x402 charity server
3. The charity server uses the x402 protocol to send USDC to the charity wallet
4. The [x402.org facilitator](https://x402.org) (run by Coinbase) settles the payment on-chain
5. A receipt with the on-chain transaction hash is returned

The user never needs a wallet or even knows a donation happened.

## Get Started

### 1. Create a Donation Wallet

Create a new wallet (MetaMask, Coinbase Wallet, etc.) and export the private key. Fund it with:
- **USDC** on Base (for donations)
- **A small amount of ETH** on Base (for gas)

### 2. Deploy the Server

```bash
git clone https://github.com/allscale-io/x402charity.git
cd x402charity
docker build -t x402charity .

docker run -p 3402:3402 \
  -e DONATION_PRIVATE_KEY="0xabc..." \
  -e CHARITY_WALLET="0xdef..." \
  -e CHARITY_NAME="Give Directly" \
  -e DONATION_NETWORK="base" \
  x402charity
```

Your server is live at `http://localhost:3402` with a built-in dashboard.

### 3. Trigger Donations

From your product server — any language, any framework:

```js
const res = await fetch('https://your-charity-server.com/donate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: '$0.001' }),
});

const receipt = await res.json();
console.log(receipt.txHash); // on-chain proof
```

## Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `DONATION_PRIVATE_KEY` | Yes | Private key of the wallet that funds donations | — |
| `CHARITY_WALLET` | Yes | Wallet address of the charity receiving donations | — |
| `CHARITY_NAME` | No | Display name for the charity | `My Charity` |
| `CHARITY_DESCRIPTION` | No | Description of the charity | — |
| `DONATION_NETWORK` | No | `base` (mainnet) or `base-sepolia` (testnet) | `base-sepolia` |
| `PORT` | No | Server port | `3402` |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/donate` | Trigger a donation. Optional body: `{ "amount": "$0.001" }` |
| `GET` | `/donations` | JSON list of all donations with totals |
| `GET` | `/charity` | Charity info (name, wallet, chain) |
| `GET` | `/address` | Donation wallet address and balances |
| `GET` | `/health` | Health check |

## Example Use Cases

- **DEX / Trading** — $0.001 per swap. 50K daily trades = $50/day to charity
- **AI Products / APIs** — $0.001 per API call or prompt
- **Games** — $0.001 per level cleared or match played
- **E-commerce** — $0.01 per order or checkout
- **Betting / Predictions** — $0.001 per bet placed
- **Payments / Banking** — $0.001 per transfer processed

## Deploy on Vercel

You can also deploy to Vercel instead of Docker:

1. Fork this repo
2. Import it in [Vercel](https://vercel.com)
3. Set the environment variables in your Vercel project settings
4. Deploy

## Repository Structure

```
x402charity/
├── packages/
│   ├── core/            # x402 charity client + registry
│   └── server/          # Express server with x402 middleware
├── registry/
│   └── charities.json   # Charity directory
├── docs/
│   └── index.html       # Landing page (x402charity.com)
├── api/
│   └── index.ts         # Vercel serverless entry point
├── Dockerfile
└── vercel.json
```

## Contributing

Contributions welcome. Please open an issue first to discuss what you'd like to change.

### Adding a Charity

To add a charity to the public registry, submit a PR editing `registry/charities.json`:

```json
{
  "id": "your-charity-id",
  "name": "Your Charity Name",
  "description": "What the charity does",
  "walletAddress": "0x...",
  "chain": "base",
  "verified": false,
  "category": "education"
}
```

## License

MIT
