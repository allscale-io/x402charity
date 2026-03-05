# x402charity Project Plan

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

### Phase 1 — Core + CLI (Start here)
- **`packages/core`** — Build the donation client that wraps x402 payments. Config a cause, an amount, call `donate()`. That's it.
- **`packages/cli`** — `npx x402charity donate <cause> <amount>` — lets anyone donate from terminal
- **`registry/charities.json`** — Seed with a few test charities, define the schema (name, wallet address, chain, description, verified status)

### Phase 2 — Middleware
- **`packages/express`** — Express middleware so any Node app can `app.use(x402charity(...))` and auto-donate on routes
- **`packages/next`** — Same for Next.js apps
- Follows the same pattern as `@x402/express` and `@x402/next` from Coinbase's repo

### Phase 3 — Registry & Discovery
- Turn `charities.json` into a queryable API or x402 Bazaar-compatible endpoint
- Let nonprofits submit PRs to add themselves (like how `awesome-x402` works)
- Add verification flow (proof of nonprofit status)

### Phase 4 — Ecosystem
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
