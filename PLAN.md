# x402charity Project Plan

> **Status:** This project is now **Solana-only**. The original plan (below) referenced Base/EVM. The implementation has been ported to:
> - `@x402/svm` (Coinbase x402 SVM scheme) instead of `@x402/evm`
> - `@solana/kit` + `@solana-program/token` instead of `viem`
> - SPL USDC on Solana (mainnet + devnet) instead of ERC-20 USDC on Base
> - Ed25519 signatures on partial Solana transactions instead of EIP-712 typed data
> - Coinbase x402 facilitator co-signs as fee payer — donor wallet needs only USDC (no SOL)
>
> Stale references in the sections below are left intact as project history.

## Project Structure

```
x402charity/
├── README.md
├── LICENSE
├── package.json
├── tsconfig.json
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── packages/
│   ├── core/                        # Framework-agnostic core logic
│   │   ├── src/
│   │   │   ├── index.ts             # Public API exports
│   │   │   ├── client.ts            # x402 charity client — sends donations
│   │   │   ├── registry.ts          # Charity registry — lookup causes & wallet addresses
│   │   │   ├── config.ts            # Configuration types & defaults
│   │   │   └── types.ts             # Shared types (Cause, Donation, Receipt, etc.)
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── express/                     # Express middleware
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── middleware.ts        # app.use(x402charity({ cause, amount }))
│   │   └── package.json
│   │
│   ├── next/                        # Next.js middleware
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── middleware.ts
│   │   └── package.json
│   │
│   └── cli/                         # CLI tool
│       ├── src/
│       │   ├── index.ts
│       │   └── commands/
│       │       ├── donate.ts        # npx x402charity donate red-cross 5
│       │       ├── list.ts          # npx x402charity list (browse causes)
│       │       └── status.ts        # npx x402charity status (check donation history)
│       ├── bin/
│       │   └── cli.js
│       └── package.json
│
├── registry/                        # Open charity directory
│   └── charities.json               # Verified charities with wallet addresses & metadata
│
├── examples/
│   ├── express-basic/               # Simple Express app with donation middleware
│   ├── nextjs-saas/                 # SaaS app donating on subscription
│   └── ai-agent/                    # AI agent that donates per API call
│
├── specs/
│   └── x402charity-spec.md          # Protocol spec: how donations are triggered & verified
│
└── docs/
    ├── getting-started.md
    ├── adding-a-charity.md          # How nonprofits can register
    └── architecture.md
```

## Development Phases

### Phase 1 — Core + CLI ✅
- **`packages/core`** — Donation client with ERC-20 USDC transfers via viem (balance check, simulate, send, verify receipt)
- **`packages/cli`** — `npx x402charity donate <cause> <amount>` — donate from terminal, plus `list` and `config` commands
- **`registry/charities.json`** — Seed with test charities, define the schema (name, wallet address, chain, description, verified status)

### Phase 2 — Middleware ✅
- **`packages/express`** — Express middleware: `app.use(x402charity(...))` auto-donates on routes
- **`packages/next`** — Next.js middleware with path-based matching
- Follows the same pattern as `@x402/express` and `@x402/next` from Coinbase's repo

### Phase 3 — x402 Protocol Integration ← **current**
Right now `packages/core` sends donations as direct ERC-20 transfers. This phase replaces that with the actual x402 protocol so donations flow through the standard HTTP 402 payment mechanism.

- **Charity endpoints as x402 resource servers** — Each charity exposes an HTTP endpoint that returns `402 Payment Required` with payment details (amount, recipient address, facilitator URL, supported assets)
- **Facilitator integration** — Use a Coinbase x402 facilitator (or self-hosted) to verify and settle payments. The client sends a signed payment payload to the facilitator, which validates it and submits the on-chain transfer
- **Client-side x402 flow in `packages/core`**:
  1. Client requests the charity's donation endpoint
  2. Server responds with `402` + `X-Payment` header containing payment requirements
  3. Client constructs and signs a payment payload (EIP-712 typed data)
  4. Client retries the request with the signed payment in the `X-Payment` header
  5. Facilitator settles the USDC transfer on-chain
  6. Charity endpoint returns `200` with donation receipt
- **Update middleware** — Express and Next.js middleware trigger the x402 flow instead of raw `writeContract` calls
- **Fallback mode** — Keep direct ERC-20 transfer as a fallback for charities that don't run an x402 endpoint yet
- **`specs/x402charity-spec.md`** — Document the charity endpoint spec: required headers, payment schema, facilitator requirements

### Phase 4 — Registry & Discovery
- Turn `charities.json` into a queryable API or x402 Bazaar-compatible endpoint
- Each charity entry includes its x402 endpoint URL alongside wallet address
- Let nonprofits submit PRs to add themselves (like how `awesome-x402` works)
- Add verification flow (proof of nonprofit status)

### Phase 5 — Ecosystem
- **Dashboard** — web UI showing total donations, leaderboard of projects, per-charity stats
- **MCP server** — so AI agents can discover and donate to charities via MCP
- **Hooks** — Webhooks/callbacks so charities get notified on donations
- **Multi-chain** — Support Base, Ethereum, Solana

## Key Design Decisions

| Decision | Recommendation | Reasoning |
|----------|---------------|-----------|
| Language | TypeScript | Matches x402 ecosystem, npm distribution |
| Monorepo | Yes (pnpm workspaces) | Follows Coinbase's pattern for x402 and AgentKit |
| Package naming | `@x402charity/core`, `@x402charity/express` | Scoped packages, mirrors `@x402/*` convention |
| Stablecoin | USDC on Base | Gas-free on Base, most x402 adoption |
| Charity registry | JSON file → API | Start simple, evolve to discovery service |

## References
- [coinbase/x402](https://github.com/coinbase/x402)
- [coinbase/agentkit](https://github.com/coinbase/agentkit)
- [x402 Bazaar Discovery Layer](https://docs.cdp.coinbase.com/x402/bazaar)
- [OpenLibx402](https://openlibx402.github.io/docs/)
