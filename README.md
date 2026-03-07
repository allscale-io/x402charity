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
cp .e
```

### CLI

Install the CLI globally:

```bash
npm install -g x402charity
```

Or run with npx:

```bash
npx x402charity --help
```

**Demo:**

![CLI Demo](https://github.com/allscale-io/x402charity/raw/main/cli-demo.gif)

**Example donation:**

```bash
# Donate $0.001 to testing-charity on Base Sepolia
npx x402charity donate testing-charity '$0.001' --network base-sepolia
```

**Available commands:**

- `x402charity donate <cause> [amount]` - Donate USDC to a charity
- `x402charity list` - List all available charities
- `x402charity balance` - Check your donation wallet balance
- `x402charity config` - Configure your donation wallet private key

### 3. Configure Your Server

Set environment variables:

```bash
# Private key of the wallet funding donations (from step 1)
export DONATION_PRIVATE_KEY=0x...

# Wallet address of the charity (defaults to AllScale Lab's charity wallet)
export CHARITY_WALLET=0x...

# Secret to protect POST /donate endpoint (generate with: openssl rand -hex 32)
export DONATE_API_KEY=...
```

### 4. Start the Server

```bash
npm start
```

Server runs on `http://localhost:3000`.

### 5. Trigger Donations from Your Product

From your backend, call:

```bash
curl -X POST http://localhost:3000/donate \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_DONATE_API_KEY" \
  -d '{"amount": "$0.001"}'
```

You'll receive a response with the transaction hash:

```json
{
  "success": true,
  "txHash": "0x...",
  "amount": "0.001",
  "currency": "USDC",
  "chain": "base",
  "from": "0x...",
  "to": "0x..."
}
```

## Dashboard

Visit `http://localhost:3000` in your browser to see the dashboard:
- Recent donations
- Donation wallet balance
- Charity wallet balance
- Transaction history

## Available Charities

Run `x402charity list` to see all available charities. Current options:

- **testing-charity** - Test charity (USDC goes to AllScale Lab's charity wallet)
- **give-directly** - GiveDirectly (coming soon)
- **red-cross** - American Red Cross (coming soon)
- **wikimedia** - Wikimedia Foundation (coming soon)

## How It's Built

- **Backend**: Node.js + Express
- **Blockchain**: Base (Ethereum L2)
- **Payments**: x402 protocol (Coinbase)
- **Dashboard**: React + Vite
- **CLI**: Commander.js

## License

MIT