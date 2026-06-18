# x402 Charity

[![GitHub stars](https://img.shields.io/github/stars/allscale-io/x402charity?style=social)](https://github.com/allscale-io/x402charity/stargazers)
[![Fork on GitHub](https://img.shields.io/github/forks/allscale-io/x402charity?style=social)](https://github.com/allscale-io/x402charity/fork)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://x402charity.com)
[![npm](https://img.shields.io/npm/v/x402charity)](https://www.npmjs.com/package/x402charity)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fallscale-io%2Fx402charity&env=DONATION_PRIVATE_KEY,CHARITY_WALLET,DONATE_API_KEY&envDescription=DONATION_PRIVATE_KEY%3A%20Solana%20donor%20secret%20key.%20CHARITY_WALLET%3A%20Solana%20wallet%20address%20of%20the%20charity.%20DONATE_API_KEY%3A%20secret%20to%20protect%20POST%20%2Fdonate%20(generate%20with%3A%20openssl%20rand%20-hex%2032).&project-name=x402charity&repository-name=x402charity)

Open-source micro-donation server powered by the [x402 protocol](https://www.x402.org/) on **Solana**. Deploy your own server, then trigger SPL USDC donations with a single HTTP call from any product.

**[Live Demo](https://x402charity.com)** | **[Deploy to Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fallscale-io%2Fx402charity&env=DONATION_PRIVATE_KEY,CHARITY_WALLET,DONATE_API_KEY&envDescription=DONATION_PRIVATE_KEY%3A%20Solana%20donor%20secret%20key.%20CHARITY_WALLET%3A%20Solana%20wallet%20address%20of%20the%20charity.%20DONATE_API_KEY%3A%20secret%20to%20protect%20POST%20%2Fdonate%20(generate%20with%3A%20openssl%20rand%20-hex%2032).&project-name=x402charity&repository-name=x402charity)** | **[npm install](https://www.npmjs.com/package/x402charity)** | **[Fork this repo](https://github.com/allscale-io/x402charity/fork)**

Built and maintained by [AllScale Lab](https://allscale.io).

> **Project status (Solana port):** This repo was recently ported from Base/EVM to **Solana**. The implementation builds cleanly and follows Coinbase's `@x402/svm` reference, but the end-to-end flow has not yet been exercised against the live x402 facilitator on devnet or mainnet from this codebase. The first deploy should run on `solana-devnet` against the Circle faucet. See [Known Issues & Future Work](#known-issues--future-work) for the punch list. The Live Demo and the `x402charity` npm package may still be serving the previous EVM version until a new release is cut.

## What Is This?

x402 Charity lets any company add micro-donations to their product. Every user action — a trade, an API call, a game action — can trigger a small USDC donation to a charity of your choice.

- No wallet or crypto knowledge needed from your users
- Your company funds the donations from a dedicated wallet
- All donations are on-chain (Solana) and publicly verifiable
- Built-in dashboard shows donation history and wallet balances
- **The donor wallet only needs USDC — no SOL needed.** The x402 facilitator co-signs transactions as fee payer.

## How It Works

```
┌──────────┐      ┌──────────────────┐      ┌──────────────────────┐
│   User   │      │  Your Product    │      │  x402 Charity Server │
│  Action  │─────>│  Server          │─────>│  (this repo)         │
└──────────┘      └──────────────────┘      └──────────┬───────────┘
  e.g. swap,        calls POST /donate                 │
  API call,          with amount                       │ signs partial
  game move                                            │ SPL transfer tx
                                                       v
                                              ┌──────────────────┐
                                              │ x402 Facilitator │
                                              │ (run by Coinbase)│
                                              └────────┬─────────┘
                                                       │ co-signs as
                                                       │ fee payer +
                                                       │ submits to Solana
                                                       v
                                              ┌──────────────────┐
                                              │ Charity Wallet   │
                                              │ receives USDC    │
                                              └──────────────────┘
```

**Step by step:**

1. **User acts** — A user does something in your product (swap, API call, game move, checkout, etc.)
2. **Your server calls ours** — Your backend sends `POST /donate` with an amount (e.g. `$0.001`) to your deployed x402 charity server
3. **x402 protocol handles payment** — The charity server signs a partial SPL USDC transfer with your donation wallet's keypair, then hands the partial transaction to the [x402 protocol](https://www.x402.org/)
4. **On-chain settlement** — The x402 facilitator (operated by Coinbase) co-signs as the fee payer and submits the transaction to Solana. USDC moves from your donation wallet's ATA to the charity's ATA.
5. **Receipt returned** — Your server gets back a response with the on-chain transaction signature as proof

The user never needs a wallet, never signs anything, and never even knows a donation happened. Your company funds all donations from a single pre-funded USDC wallet — no SOL required.

## Get Started

### 1. Create a Donation Wallet

Create a new Solana wallet (Phantom, Solflare, or `solana-keygen new -o id.json`) and export the secret key. Two formats are accepted:

- **JSON array** (Solana CLI convention): `[12,34,...,255]` — 64 numbers
- **Base58** (Phantom export): `4xZ...` — a single base58-encoded 64-byte string

Fund it with **USDC on Solana**. SOL is not required — the x402 facilitator pays gas.

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
  -e DONATION_PRIVATE_KEY="[12,34,...]" \
  -e CHARITY_WALLET="So11111111..." \
  -e CHARITY_NAME="Give Directly" \
  -e DONATION_NETWORK="solana-mainnet" \
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
console.log(receipt.txHash); // on-chain Solana signature
```

## Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `DONATION_PRIVATE_KEY` | Yes | Solana donor secret key. Base58 64-byte secret or JSON array of 64 bytes. | — |
| `CHARITY_WALLET` | Yes | Solana wallet address (base58 pubkey) of the charity. | — |
| `CHARITY_NAME` | No | Display name for the charity | `My Charity` |
| `CHARITY_DESCRIPTION` | No | Description of the charity | — |
| `DONATION_NETWORK` | No | `solana-mainnet` or `solana-devnet`. **Mainnet requires `FACILITATOR_URL` to be set** — the default x402.org facilitator currently advertises Solana devnet only. | `solana-devnet` |
| `FACILITATOR_URL` | No | Override the x402 facilitator URL. Required for `solana-mainnet`. PayAI (`https://facilitator.payai.network`) is the current mainnet-capable option; self-hosted facilitators also work. | `https://x402.org/facilitator` |
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
| `GET` | `/donations` | JSON list of recent donations with totals. Accepts `?limit=N` (default 50, max 200). |
| `GET` | `/charity` | Charity info (name, wallet, chain) + USDC/SOL balances |
| `GET` | `/address` | Donation wallet address + USDC/SOL balances |
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

For a complete example, see [examples/express-app](examples/express-app).

```js
import { x402charity } from 'x402charity/express';

app.use('/api', await x402charity({
  privateKey: process.env.DONATION_PRIVATE_KEY,
  donateEndpoint: 'https://your-charity-server.com/donate',
  charity: {
    id: 'my-charity',
    name: 'My Charity',
    walletAddress: 'So11111111...',
    chain: 'solana-devnet',
    description: 'My charity description',
    verified: false,
    x402Endpoint: 'https://your-charity-server.com/donate',
  },
  amount: '$0.001',
  shouldDonate: (req) => req.method === 'POST',
}));
```

> Note: the middleware factory is async (Solana keypair import requires an `await`).

### Option C: Next.js Middleware

```js
// middleware.ts
import { x402charity } from 'x402charity/next';

export default await x402charity({
  privateKey: process.env.DONATION_PRIVATE_KEY,
  donateEndpoint: 'https://your-charity-server.com/donate',
  charity: {
    id: 'my-charity',
    name: 'My Charity',
    walletAddress: 'So11111111...',
    chain: 'solana-devnet',
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
# Configure once (writes to ~/.x402charity/config.json, chmod 600):
npx x402charity config set-key '[12,34,...]'        # base58 secret or JSON-array
npx x402charity config set-network solana-devnet

# Or pass via env vars:
export X402_PRIVATE_KEY='[12,34,...]'
export X402_NETWORK=solana-devnet

# Browse charities and donate:
npx x402charity list
npx x402charity donate testing-charity '$0.001' --network solana-devnet
npx x402charity config show
```

## Example Use Cases

- **DEX / Trading** — $0.001 per swap. 50K daily trades = $50/day to charity
- **AI Products / APIs** — $0.001 per API call or prompt
- **Games** — $0.001 per level cleared or match played
- **E-commerce** — $0.01 per order or checkout
- **Betting / Predictions** — $0.001 per bet placed
- **Payments / Banking** — $0.001 per transfer processed

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fallscale-io%2Fx402charity&env=DONATION_PRIVATE_KEY,CHARITY_WALLET,DONATE_API_KEY&envDescription=DONATION_PRIVATE_KEY%3A%20Solana%20donor%20secret%20key.%20CHARITY_WALLET%3A%20Solana%20wallet%20address%20of%20the%20charity.%20DONATE_API_KEY%3A%20secret%20to%20protect%20POST%20%2Fdonate%20(generate%20with%3A%20openssl%20rand%20-hex%2032).&project-name=x402charity&repository-name=x402charity)

Or deploy manually:

1. Fork this repo
2. Import it in [Vercel](https://vercel.com)
3. Set the following environment variables in your Vercel project settings:
   - `DONATION_PRIVATE_KEY` — Solana donor secret key (base58 or JSON array)
   - `CHARITY_WALLET` — Solana wallet address (base58 pubkey)
   - `CHARITY_NAME` — display name for the charity (optional)
   - `DONATION_NETWORK` — `solana-mainnet` or `solana-devnet` (default: `solana-devnet`)
   - `DONATE_API_KEY` — secret key to protect `POST /donate` (recommended). Generate with: `openssl rand -hex 32`
4. Deploy

> **Note:** `BASE_URL` is auto-detected on Vercel. If you deploy elsewhere (Railway, Fly, etc.), set `BASE_URL` to your server's public URL (e.g. `https://your-app.fly.dev`).

### Funding Your Donation Wallet

Before donations can work, your donation wallet needs USDC on the correct network:

- **If using `solana-devnet` (testnet, the default):** Get devnet USDC from the [Circle faucet](https://faucet.circle.com/) (choose Solana → Devnet). No SOL needed for the donor wallet.
- **If using `solana-mainnet`:** Fund the donor wallet with real USDC on Solana, **and** point `FACILITATOR_URL` at a mainnet-capable facilitator (e.g. `https://facilitator.payai.network`). No SOL needed in this wallet — the facilitator pays gas. The default `https://x402.org/facilitator` does **not** currently support Solana mainnet.

> **ATA bootstrapping:** SPL USDC is held in an Associated Token Account (ATA) derived from `(wallet, mint)`. The x402 facilitator is expected to include an ATA-create instruction on the first donation to a charity whose ATA does not yet exist, but **this has not been verified end-to-end from this codebase yet** — see [Known Issues](#known-issues--future-work). If your first mainnet donation fails because the charity ATA doesn't exist, pre-create it manually with `spl-token create-account <USDC_MINT> --owner <CHARITY_WALLET>` (rent is ~0.002 SOL, one-time).

## What's Hosted from This Repo

This repo is the source of truth for three published artefacts:

| Artefact | Where | What's published from this repo |
|---|---|---|
| **Website** — [x402charity.com](https://x402charity.com) | Vercel (project linked to `allscale-io/x402charity`, auto-deploys from `main`) | The static landing page + dashboard (`docs/`) and the API endpoints (`api/index.ts` → wraps `@x402charity/server`). The Vercel build copies `docs/{index.html, colors_and_type.css, x402-charity.js, assets/, fonts/}` into `public/`, and serverless rewrites send `/donate`, `/donations`, `/address`, `/charity`, `/health` to `api/index.ts`. |
| **npm package** — [`x402charity`](https://www.npmjs.com/package/x402charity) | npm registry | Built from `packages/core/`. Includes the `X402CharityClient`, the Express + Next.js middleware, the registry helpers, and the `npx x402charity` CLI. |
| **GitHub repo** — [allscale-io/x402charity](https://github.com/allscale-io/x402charity) | GitHub | This repo. |

A second internal package (`@x402charity/server`, in `packages/server/`) is the Express app the Vercel function and the Dockerfile both run. It is **not published to npm** — it's a workspace-only package used by the Vercel deploy and anyone running `pnpm dev` / `docker run x402charity`.

## Repository Structure

```
x402charity/
├── packages/
│   ├── core/                          # npm package "x402charity" — client, middleware, CLI
│   └── server/                        # Express donation server (not on npm; used by Vercel + Docker)
├── registry/
│   └── charities.json                 # Charity directory
├── docs/                              # Source of the live website. All files here get copied to public/ at build time.
│   ├── index.html                     # Landing page + dashboard markup
│   ├── colors_and_type.css            # AllScale design-system tokens
│   ├── x402-charity.js                # Frontend logic (live feed, dashboard, game, copy buttons)
│   ├── assets/                        # Logo, chain & token icons
│   │   ├── allscale-logo.svg
│   │   ├── chain/solana.svg
│   │   └── tokens/{usdc,sol}.svg
│   └── fonts/Archivo-VariableFont.ttf # Brand font
├── api/
│   └── index.ts                       # Vercel serverless entry point (wraps the Express app)
├── public/                            # GENERATED at build time by `vercel.json`. Do not edit. Gitignored except .gitkeep.
├── Dockerfile
└── vercel.json                        # Vercel build/rewrite config
```

## Known Issues & Future Work

The Solana port is recent. The following items are known gaps or follow-ups — contributions welcome.

### Verified during the Solana port

- **Server boots cleanly on `solana-devnet`** with the default x402.org facilitator. `/health`, `/charity`, `/address`, `/donations` all respond; static assets serve correctly; `POST /donate` against an unfunded wallet fails fast with `{"error":"Donation failed","details":"x402 donation failed (402): ..."}` rather than hanging.
- **`https://x402.org/facilitator/supported` advertises Solana devnet** (CAIP-2 `solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1`) and returns a `feePayer` of `CKPKJWNdJEqa81x7CkZ14BVPiY6y16Sxs7owznqtWYp5` — confirming facilitator-as-fee-payer mode is wired correctly.

### Needs verification (before mainnet use)

- **End-to-end donation against a funded wallet has not been exercised yet.** The server starts and reaches the x402 handshake, but no real on-chain donation has been settled from this codebase. Next step: fund the donor wallet with devnet USDC from `faucet.circle.com` (Solana → Devnet), POST `/donate`, and confirm the receipt contains a real Solana signature visible on Solscan.
- **First-donation ATA creation.** `@x402/svm` is expected to include a `createAssociatedTokenAccount` instruction in the partial transaction when the charity ATA does not exist, with the facilitator paying the ~0.002 SOL rent. This has not been confirmed against a charity wallet that has never held USDC. Workaround: pre-create the charity ATA with `spl-token create-account` if the first donation fails.

### Known limitations

- **Mainnet requires a non-default facilitator.** The public `https://x402.org/facilitator` currently advertises Solana **devnet only**. Booting with `DONATION_NETWORK=solana-mainnet` and no `FACILITATOR_URL` will crash at startup with `Facilitator does not support scheme "exact" on network "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"`. To use mainnet today, set `FACILITATOR_URL=https://facilitator.payai.network` (or another mainnet-capable facilitator) — the server now supports this override.

### Known limitations

- **`/donations` RPC quota.** Donation history is reconstructed from `getSignaturesForAddress(charityATA)` + `getTransaction()` per signature. Public Solana RPCs (`api.mainnet-beta.solana.com`, `api.devnet.solana.com`) throttle aggressively. Expect failures or partial results above a few requests per minute. Plug in a Helius / QuickNode / Triton RPC URL by extending `packages/server/src/server.ts` to read `SOLANA_MAINNET_RPC` / `SOLANA_DEVNET_RPC` env vars and pass them to `createSolanaRpc(...)`.
- **`/donations` query semantics changed.** The previous EVM version accepted `?daysAgo=N` and scanned a calendar day of blocks. The Solana version accepts `?limit=N` (default 50, max 200) and returns the last N signatures touching the charity ATA. Any client that hard-coded `daysAgo` needs to be updated.
- **Donation queue + retry logic is unchanged from the EVM version.** `POST /donate` serializes calls and retries up to 3× with a 1 s delay. On EVM this guarded against nonce conflicts; on Solana (facilitator-as-fee-payer, ~400 ms finality) it is largely redundant and adds latency. It is safe but could be simplified.

### Roadmap-ish

- **Demo wallet & charity registry.** `registry/charities.json` currently contains one placeholder entry (`GokT7XLkr4ezHGB6KrLwTGyhCSVF8YJaqbVf2ZNeAJxr` on devnet) used only as a fallback. Replace with a real testing charity wallet before promoting the demo, and document the registry submission flow for Solana charities.
- **Republish the npm package.** The current `x402charity` package on npm is the EVM version (`viem` + `@x402/evm`). Bump to a new major (this is a breaking API change — middleware factories are now async, and the secret-key format changed) and publish.
- **Redeploy the live demo.** [x402charity.com](https://x402charity.com) currently serves the EVM build. The static landing/dashboard HTML in this repo has been updated, but a fresh Vercel deploy is needed to make the live demo Solana-only.
- **`@x402/svm` peer-dep pin.** `@solana/kit` is pinned at `^5.5.1` to match the version `@x402/svm@2.11.0`'s nested `@solana-program/token@0.9.0` was built against. Once `@x402/svm` publishes a release built against `@solana/kit@^6.x`, bump both.
- **Stale historical docs.** `PLAN.md`, `ISSUES_AND_FIXES.md`, and `PROMOTION_STRATEGY.md` have disclaimers at the top noting they predate the Solana migration. Rewrite (or delete) them when convenient.

## Contributing

Contributions welcome. Please open an issue first to discuss what you'd like to change.

### Adding a Charity

To add a charity to the public registry, submit a PR editing `registry/charities.json`:

```json
{
  "id": "your-charity-id",
  "name": "Your Charity Name",
  "description": "What the charity does",
  "walletAddress": "So11111111...",
  "chain": "solana-mainnet",
  "verified": false,
  "category": "education",
  "x402Endpoint": "https://your-charity-server.com/donate"
}
```

## License

MIT
