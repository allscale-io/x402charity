# x402 Charity

[![GitHub stars](https://img.shields.io/github/stars/allscale-io/x402charity?style=social)](https://github.com/allscale-io/x402charity/stargazers)
[![Fork on GitHub](https://img.shields.io/github/forks/allscale-io/x402charity?style=social)](https://github.com/allscale-io/x402charity/fork)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://x402charity.com)
[![npm](https://img.shields.io/npm/v/x402charity)](https://www.npmjs.com/package/x402charity)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fallscale-io%2Fx402charity&env=DONATION_PRIVATE_KEY,CHARITY_WALLET,DONATE_API_KEY&envDescription=DONATION_PRIVATE_KEY%3A%20private%20key%20of%20wallet%20funding%20donations.%20CHARITY_WALLET%3A%20wallet%20address%20of%20the%20charity.%20DONATE_API_KEY%3A%20secret%20to%20protect%20POST%20%2Fdonate%20(generate%20with%3A%20openssl%20rand%20-hex%2032).&project-name=x402charity&repository-name=x402charity)

Open-source micro-donation server powered by the [x402 protocol](https://www.x402.org/) on Base. Deploy your own server, then trigger USDC donations with a single HTTP call from any product.

**[Live Demo](https://x402charity.com)** | **[Deploy to Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fallscale-io%2Fx402charity&env=DONATION_PRIVATE_KEY,CHARITY_WALLET,DONATE_API_KEY&envDescription=DONATION_PRIVATE_KEY%3A%20private%20key%20of%20wallet%20funding%20donations.%20CHARITY_WALLET%3A%20wallet%20address%20of%20the%20charity.%20DONATE_API_KEY%3A%20secret%20to%20protect%20POST%20%2Fdonate%20(generate%20with%3A%20openssl%20rand%20-hex%2032).&project-name=x402charity&repository-name=x402charity)** | **[npm install](https://www.npmjs.com/package/x402charity)** | **[Fork this repo](https://github.com/allscale-io/x402charity/fork)**

Built and maintained by [AllScale Lab](https://allscale.io).

## What Is This?

x402 Charity lets any company add micro-donations to their product. Every user action — a trade, an API call, a game action — can trigger a small USDC donation to a charity of your choice.

- No wallet or crypto knowledge needed from your users
- Your company funds the donations from a dedicated wallet
- All donations are on-chain and publicly verifiable
- Built-in dashboard shows donation history and wallet balances

## How It Works

```
┌──────────┐      ┌──────────────────┐      ┌──────────────────────┐
│   User   │      │  Your Product    │      │  x402 Charity Server │
│  Action  │─────>│  Server          │─────>│  (this repo)         │
└──────────┘      └──────────────────┘      └──────────┬───────────┘
  e.g. swap,        calls POST /donate                 │
  API call,          with amount                       │ signs payment
  game move                                            │ via x402 protocol
                                                       v
                                              ┌──────────────────┐
                                              │ x402 Facilitator │
                                              │ (run by Coinbase)│
                                              └────────┬─────────┘
                                                       │ settles USDC
                                                       │ on Base
                                                       v
                                              ┌──────────────────┐
                                              │ Charity Wallet   │
                                              │ receives USDC    │
                                              └──────────────────┘
```

**Step by step:**

1. **User acts** — A user does something in your product (swap, API call, game move, checkout, etc.)
2. **Your server calls ours** — Your backend sends `POST /donate` with an amount (e.g. `$0.001`) to your deployed x402 charity server
3. **x402 protocol handles payment** — The charity server uses your pre-funded donation wallet to sign a USDC payment via the [x402 protocol](https://www.x402.org/)
4. **On-chain settlement** — The x402 facilitator (operated by Coinbase) settles the payment on Base — USDC moves from your donation wallet to the charity wallet
5. **Receipt returned** — Your server gets back a response with the on-chain transaction hash as proof

The user never needs a wallet, never signs anything, and never even knows a donation happened. Your company funds all donations from a single pre-funded wallet.

## Get Started

### 1. Create a Donation Wallet

Create a new wallet (MetaMask, Coinbase Wallet, etc.) and export the private key. Fund it with:
- **USDC** on Base (for donations)
- **A small amount of ETH** on Base (for gas)

### 2. Deploy the Server

**Option A: Run locally**

```bash
git clone https://github.com/allscale-io/x402charity.git
cd x402charity
cp .env.example .env   # edit .env with your keys
pnpm install
pnpm dev
```

**Option B: Docker**

```bash
git clone https://github.com/allscale-io/x402charity.git
cd x402charity
docker build -t x402charity .

docker run -p 3402:3402 \
  -e DONATION_PRIVATE_KEY="0xabc..." \
  -e CHARITY_WALLET="0xdef..." \
  -e CHARITY_NAME="Give Directly" \
  -e DONATION_NETWORK="base" \
  -e DONATE_API_KEY="$(openssl rand -hex 32)" \
  x402charity
```

Your server is live at `http://localhost:3402` with a built-in dashboard.

### 3. Trigger Donations

From your product server — any language, any framework:

```js
const res = await fetch('https://your-charity-server.com/donate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_DONATE_API_KEY',
  },
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
| `BASE_URL` | No | Public URL of your server (auto-detected on Vercel) | `http://localhost:3402` |
| `PORT` | No | Server port | `3402` |
| `DONATE_API_KEY` | No | Secret key to protect `POST /donate`. If set, callers must send `Authorization: Bearer <key>`. If unset, the endpoint is open. **Set this in production.** | — (open) |
| `CORS_ORIGINS` | No | Comma-separated list of allowed CORS origins (e.g. `https://myapp.com,https://admin.myapp.com`). If unset, all origins are allowed. | `*` (all origins) |

> **Security notes:**
> - **Never commit your `DONATION_PRIVATE_KEY`** to version control. Use environment variables or a secret manager (e.g. Vercel Environment Variables, AWS Secrets Manager). The private key controls the donation wallet funds.
> - **Set `DONATE_API_KEY` in production.** Without it, anyone who knows your server URL can trigger donations and drain your wallet. Generate one with: `openssl rand -hex 32`

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/donate` | Trigger a donation. Requires `Authorization: Bearer <DONATE_API_KEY>` if API key is set. Optional body: `{ "amount": "$0.001" }` |
| `GET` | `/donations` | JSON list of all donations with totals |
| `GET` | `/charity` | Charity info (name, wallet, chain) |
| `GET` | `/address` | Donation wallet address and balances |
| `GET` | `/health` | Health check |

## Integrate with Your Product

```bash
npm install x402charity
```

### Option A: Simple HTTP Call (any language)

The simplest way — just call your deployed server's `POST /donate` endpoint:

```js
await fetch('https://your-charity-server.com/donate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_DONATE_API_KEY',
  },
  body: JSON.stringify({ amount: '$0.001' }),
});
```

### Option B: Express Middleware

```js
import { x402charity } from 'x402charity/express';

app.use('/api', x402charity({
  privateKey: process.env.DONATION_PRIVATE_KEY,
  donateEndpoint: 'https://your-charity-server.com/donate',
  charity: {
    id: 'my-charity',
    name: 'My Charity',
    walletAddress: '0x...',
    chain: 'base-sepolia',
    description: 'My charity description',
    verified: false,
    x402Endpoint: 'https://your-charity-server.com/donate',
  },
  amount: '$0.001',
  shouldDonate: (req) => req.method === 'POST',
}));
```

### Option C: Next.js Middleware

```js
// middleware.ts
import { x402charity } from 'x402charity/next';

export default x402charity({
  privateKey: process.env.DONATION_PRIVATE_KEY,
  donateEndpoint: 'https://your-charity-server.com/donate',
  charity: {
    id: 'my-charity',
    name: 'My Charity',
    walletAddress: '0x...',
    chain: 'base-sepolia',
    description: 'My charity description',
    verified: false,
    x402Endpoint: 'https://your-charity-server.com/donate',
  },
  amount: '$0.001',
  matcher: '/api/*',
});
```

### Option D: CLI

```bash
npx x402charity donate testing-charity '$0.001' --network base-sepolia
```

<details>
<summary>📺 CLI Demo Output</summary>

```
$ npx x402charity donate testing-charity '$0.001' --network base-sepolia

🔗 Connecting to base-sepolia...
📋 Charity: Testing Charity (testing-charity)
💸 Donating $0.001 USDC...

✅ Donation successful!

   Transaction: 0x7a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f8f2e
   Amount:      $0.001 USDC
   Charity:     Testing Charity
   Network:     base-sepolia
   BaseScan:    https://sepolia.basescan.org/tx/0x7a3b...8f2e
```

</details>

## Example Use Cases

- **DEX / Trading** — $0.001 per swap. 50K daily trades = $50/day to charity
- **AI Products / APIs** — $0.001 per API call or prompt
- **Games** — $0.001 per level cleared or match played
- **E-commerce** — $0.01 per order or checkout
- **Betting / Predictions** — $0.001 per bet placed
- **Payments / Banking** — $0.001 per transfer processed

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fallscale-io%2Fx402charity&env=DONATION_PRIVATE_KEY,CHARITY_WALLET,DONATE_API_KEY&envDescription=DONATION_PRIVATE_KEY%3A%20private%20key%20of%20wallet%20funding%20donations.%20CHARITY_WALLET%3A%20wallet%20address%20of%20the%20charity.%20DONATE_API_KEY%3A%20secret%20to%20protect%20POST%20%2Fdonate%20(generate%20with%3A%20openssl%20rand%20-hex%2032).&project-name=x402charity&repository-name=x402charity)

Or deploy manually:

1. Fork this repo
2. Import it in [Vercel](https://vercel.com)
3. Set the following environment variables in your Vercel project settings:
   - `DONATION_PRIVATE_KEY` — private key of the wallet that funds donations
   - `CHARITY_WALLET` — wallet address of the charity receiving donations
   - `CHARITY_NAME` — display name for the charity (optional)
   - `DONATION_NETWORK` — `base` for mainnet or `base-sepolia` for testnet (default: `base-sepolia`)
   - `DONATE_API_KEY` — secret key to protect `POST /donate` (recommended). Generate with: `openssl rand -hex 32`
4. Deploy

> **Note:** `BASE_URL` is auto-detected on Vercel. If you deploy elsewhere (Railway, Fly, etc.), set `BASE_URL` to your server's public URL (e.g. `https://your-app.fly.dev`).

### Funding Your Donation Wallet

Before donations can work, your donation wallet needs funds on the correct network:

- **If using `base-sepolia` (testnet, the default):** Get testnet USDC from the [Circle faucet](https://faucet.circle.com/) and testnet ETH from a [Base Sepolia faucet](https://www.alchemy.com/faucets/base-sepolia).
- **If using `base` (mainnet):** Fund the wallet with real USDC and a small amount of ETH for gas on Base.

## Repository Structure

```
x402charity/
├── packages/
│   ├── core/            # npm package: client, middleware, CLI (x402charity)
│   └── server/          # Deployable donation server
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
  "category": "education",
  "x402Endpoint": "https://your-charity-server.com/donate"
}
```

## License

MIT
