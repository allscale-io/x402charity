# x402charity Promotion Strategy

## TODO Checklist

### 1. Ecosystem Listings (Do First -- quick PRs, high impact)
- [ ] Submit PR to awesome-x402 (xpaysh): https://github.com/xpaysh/awesome-x402
- [ ] Submit PR to awesome-x402 (Merit-Systems): https://github.com/Merit-Systems/awesome-x402
- [ ] Submit PR to awesome-x402-servers (a6b8): https://github.com/a6b8/awesome-x402-servers -- specifically lists x402 servers, x402charity is a perfect fit
- [ ] Submit PR to awesome-base (wbnns): https://github.com/wbnns/awesome-base -- Base ecosystem list, add under a "Social Impact" or "Tools" section
- [ ] Submit to x402.org/ecosystem directory (official x402 ecosystem page)
- [ ] Submit to x402dev.com/awesome-projects
- [ ] Open a discussion/issue on coinbase/x402 GitHub showcasing x402charity as a community project: https://github.com/coinbase/x402
- [ ] Submit to Electric Capital open-dev-data (gets tracked in developer reports): https://github.com/electric-capital/crypto-ecosystems -- fork, add a .toml file under data/ecosystems/, open PR
- [ ] Submit to RootData (crypto project database, has x402 tag): https://www.rootdata.com/Projects/submit
- [ ] Submit to Base Ecosystem Page: https://www.base.org/ecosystem
- [ ] Submit to Alchemy Dapp Store: https://www.alchemy.com/dapps

### 2. Social & Community (Do This Week)
- [ ] Post on Farcaster /base and /base-builds channels, tag @base
- [ ] Join Build on Base Discord: https://discord.com/invite/buildonbase
- [ ] Join Coinbase CDP Discord: https://discord.com/invite/cdp
- [ ] Join AgentPay x402 Discord: https://discord.com/invite/uEmcWj8xMX
- [ ] Start engaging (answer questions, provide value) before promoting

### 3. GitHub & npm Optimization
- [x] ~~Add 20 GitHub topics for discoverability~~ (done: x402, http-402, micropayments, micro-donations, charity, usdc, base, stablecoin, cryptocurrency, web3, ethereum, payments, express-middleware, nextjs, typescript, npm-package, open-source, developer-tools, coinbase, blockchain)
- [x] ~~Update GitHub repo description (350 char, keyword-rich)~~
- [x] ~~Set GitHub repo homepage to x402charity.com~~
- [x] ~~Add npm keywords to all 4 package.json files (core, cli, express, next)~~
- [x] ~~Add `description`, `homepage`, `repository` fields to all package.json files~~
- [x] ~~Add shields.io badges to README (npm version, downloads, stars, TypeScript, license)~~
- [x] ~~Improve README first paragraph for Google snippet / SEO~~
- [ ] Add a GIF or screenshot of the CLI in action to README
- [ ] Publish @x402charity packages to npm (core, cli, express, next) if not already done -- npm discoverability

### 4. Grants & Programs (Apply This Month)
- [ ] Apply for CDP Builder Grants (next round): https://www.coinbase.com/developer-platform/discover/launches
- [ ] Self-nominate for Base Builder Grants: https://docs.base.org/get-started/get-funded
- [ ] Apply for CDP AI Builder Grants: https://www.coinbase.com/developer-platform/discover/launches/ai-builder-grants

### 5. Content & Launch (Weeks 2-4)
- [ ] Write launch blog post: "How to Add Charitable Micro-Donations to Any Web App in 10 Lines of Code"
- [ ] Publish on own domain, then cross-post to dev.to, Hashnode, Medium
- [ ] Coordinated launch day: HN Show HN, Reddit r/ethdev + r/opensource, Twitter thread, Farcaster, dev.to, CDP Discord
- [ ] Launch on Product Hunt (web3 category): https://www.producthunt.com/ -- prep a launch page with demo GIF
- [ ] Launch on Web3Scout ("Product Hunt for Crypto"): https://web3scout.cryptechie.com/
- [ ] Record 5-10 min YouTube tutorial
- [ ] Start Twitter/X build-in-public cadence (1 post/day)

### 6. Partnerships (Weeks 4-8)
- [ ] Reach out to GiveDirectly (Tier 1 charity partner)
- [ ] Reach out to UNICEF Venture Fund (Tier 1 charity partner)
- [ ] Reach out to Save the Children (Tier 1 charity partner)
- [ ] Explore Every.org or Endaoment as compliance/DAF intermediary
- [ ] Build AgentKit / MCP server integration (Phase 4)

### 7. Hackathons & Events
- [ ] ETHGlobal Cannes (Apr 3-5, 2026) -- attend or submit bounty
- [ ] ETHGlobal New York (Jun 12-14, 2026)
- [ ] Create hackathon starter template repo
- [ ] Create "good first issue" GitHub bounties ($25-$100)

### 8. Media & PR (Weeks 6-12)
- [ ] Pitch Crypto Altruists (cryptoaltruists.com) -- crypto + social impact
- [ ] Pitch CoinDesk -- "programmable giving via x402"
- [ ] Pitch Chronicle of Philanthropy -- "developer tool for programmable giving"
- [ ] Guest post on Coinbase Developer Blog (reach out to DevRel)

---

## Executive Summary

x402charity occupies a unique niche: **automated USDC micro-donations on Base, triggered by HTTP events**. No other project does this. The x402 ecosystem has 140M+ transactions processed, crypto charitable giving hit $2B+ in 2025 (doubling YoY), and stablecoins are now 44% of all crypto donations. The opportunity is real -- the challenge is awareness.

This document lays out a concrete, prioritized plan to get x402charity in front of the right people.

---

## Part 1: Urgent Actions (This Week)

### 1.1 Submit to awesome-x402 Lists

Open PRs to get listed on these curated directories:

- https://github.com/xpaysh/awesome-x402
- https://github.com/Merit-Systems/awesome-x402

Also submit to:
- x402.org/ecosystem (the official x402 ecosystem page)
- x402dev.com/awesome-projects

### 1.3 Post on Farcaster

Share x402charity on Farcaster's /base and /base-builds channels. Tag @base on both Farcaster and X. The Base team actively monitors these channels and amplifies projects. Jesse Pollak (@jessepollak), the creator of Base, personally engages with builders.

---

## Part 2: Near-Term (Next 2 Weeks)

### 2.1 GitHub & npm Optimization

**GitHub Topics (add up to 20):**
```
x402, http-402, micropayments, micro-donations, charity, usdc,
base, stablecoin, cryptocurrency, web3, ethereum, payments,
express-middleware, nextjs, typescript, npm-package,
open-source, developer-tools, coinbase, blockchain
```

**GitHub About description (350 char max):**
> Automatic micro-donations powered by x402. Drop-in Express/Next.js middleware that sends USDC to charities on every user action. npm install x402charity.

**npm package.json keywords:**
```json
["x402", "charity", "donation", "micropayments", "usdc", "base",
 "stablecoin", "express", "nextjs", "middleware", "web3",
 "crypto", "payments", "http-402", "blockchain"]
```

**README improvements:**
- Add shields.io badges: npm version, npm downloads, GitHub stars, license, TypeScript
- Add a GIF or screenshot of the CLI in action
- First paragraph should be a Google-snippet-friendly one-liner

### 2.2 Apply for CDP Builder Grants

Coinbase runs seasonal grant rounds (~$30K pool, ten $3K grants each). x402charity uses x402, which is a core CDP technology.

- Check for the latest round: https://www.coinbase.com/developer-platform/discover/launches
- Past rounds: Spring 2025, Summer 2025, AI Builder Grants ($15K)
- Mentioning x402 integration strengthens the application significantly

### 2.3 Self-Nominate for Base Builder Grants

Base gives retroactive grants (1-5 ETH) to projects that have already shipped. Over 400 builders have received them (~$2,500 average).

- Link: https://docs.base.org/get-started/get-funded
- Blog: https://paragraph.com/@grants.base.eth/calling-based-builders

### 2.4 Join the Communities

Join and become active in these channels before promoting:

| Community | Link | Members |
|-----------|------|---------|
| Build on Base Discord | https://discord.com/invite/buildonbase | 539K+ |
| Coinbase CDP Discord | https://discord.com/invite/cdp | 22K+ |
| AgentPay x402 Discord | https://discord.com/invite/uEmcWj8xMX | 42K+ |

Answer questions, provide value, and build credibility before sharing x402charity.

---

## Part 3: Content & Launch Strategy (Weeks 2-4)

### 3.1 Launch Blog Post

Write a problem-focused post: **"How to Add Charitable Micro-Donations to Any Web App in 10 Lines of Code"**

Structure:
1. The problem: charitable giving requires friction; developers want to give but don't integrate it
2. The solution: x402charity makes it a one-liner
3. Working code example (Express and Next.js)
4. Why USDC on Base (sub-cent fees make micro-donations viable)
5. Call to action: npm install, star the repo

Publish on your own domain first (SEO ownership), then cross-post to:
- dev.to (tags: javascript, web3, opensource, tutorial)
- Hashnode
- Medium

### 3.2 Coordinated Launch Day

Pick a single day and post across all channels within the same 24-hour window. GitHub Trending rewards sudden spikes relative to your baseline.

**Channel checklist:**
- [ ] Hacker News: "Show HN: x402charity -- npm middleware that auto-donates USDC to charities on every API call"
- [ ] Reddit r/ethdev: frame as "I built X, here's what I learned about HTTP 402 payments"
- [ ] Reddit r/opensource, r/SideProject: project showcase
- [ ] Twitter/X: technical thread (5-10 tweets) explaining the problem and solution
- [ ] Farcaster /base channel
- [ ] dev.to cross-post
- [ ] CDP Discord #showcase channel

**Hacker News tips:**
- Use "Show HN:" prefix
- Be direct in the title -- no superlatives
- Respond to every comment in the first 2 hours
- Don't ask anyone to upvote (detection will suppress the post)
- Link to a blog post, not directly to GitHub

### 3.3 Video Content

Record a 5-10 min YouTube tutorial: "Add Automatic Charity Donations to Your Express App."

- Walk through a real integration from `npm install` to seeing a transaction on-chain
- Upload natively to X as well (the algorithm favors native video)
- Post the video link in the blog post

### 3.4 Twitter/X Build-in-Public Strategy

Post frequency: 1 substantial tweet/thread per day.

Content mix:
- 40% technical content (code snippets, architecture decisions, x402 explainers)
- 30% build-in-public updates ("This week: shipped Express middleware, 3 new charities in the registry")
- 20% engaging with others (reply to x402/Base/crypto charity discussions with helpful context)
- 10% direct project announcements

Key accounts to engage with (reply to their content, quote-tweet with added value):
- @jessepollak (creator of Base)
- @CoinbaseDev (CDP official)
- @buildonbase (Base official)
- @x402 or x402 Foundation accounts

---

## Part 4: Partnerships & Ecosystem (Weeks 4-8)

### 4.1 Charity Partners

The ideal first partners are organizations that are already crypto-native and have USDC/Base infrastructure:

**Tier 1 (Reach out first):**
| Organization | Why | Notes |
|---|---|---|
| GiveDirectly | Already partnered with Coinbase on USDC distribution; direct cash transfer model | Perfect alignment with micro-donation model |
| UNICEF Venture Fund | Already receives on-chain funds via Lido Impact Staking | Global brand, tech-forward |
| Save the Children | Early crypto adopter with dedicated crypto donation infrastructure | Has a Bitcoin fund |

**Tier 2:**
| Organization | Why | Notes |
|---|---|---|
| The Water Project | Clear per-unit impact metrics (cost per well) | Easy to show "your micro-donations funded X" |
| Trees for the Future | Crypto = ~25% of their individual giving | Quantifiable impact (cost per tree) |

**Infrastructure Partners (intermediaries):**
| Organization | Why | Notes |
|---|---|---|
| Every.org | 501(c)(3) DAF platform, handles compliance, 1M+ nonprofits | Zero platform fees for nonprofits |
| Endaoment | First on-chain 501(c)(3), ~$130M facilitated | Could receive and distribute on-chain |
| Circle Foundation | Focused on financial resilience, natural USDC alignment | Launched late 2025 |

### 4.2 Technical Integrations

Build integrations that create downstream adoption:

1. **AgentKit integration** -- Build the MCP server (Phase 4 in PLAN.md) so AI agents can discover and donate through x402charity. This aligns directly with Coinbase Ventures' 2026 AI agent thesis.

2. **OnchainKit dashboard** -- Build a donation tracker/dashboard using OnchainKit components. This creates a visible, shareable artifact.

3. **Superfluid streaming donations** -- Integrate with Superfluid for recurring micro-donations (per-second streaming). The x402 hackathon winner "x402-sf" already proved this concept.

### 4.3 Ecosystem Directories

Submit x402charity for listing on:

| Directory | URL | Notes |
|-----------|-----|-------|
| x402.org Ecosystem | https://www.x402.org/ecosystem | Official x402 directory -- highest priority |
| awesome-x402 (xpaysh) | https://github.com/xpaysh/awesome-x402 | Curated x402 resources list -- open a PR |
| awesome-x402 (Merit-Systems) | https://github.com/Merit-Systems/awesome-x402 | Another x402 ecosystem list -- open a PR |
| awesome-x402-servers (a6b8) | https://github.com/a6b8/awesome-x402-servers | Specifically lists x402 servers -- perfect fit |
| awesome-base (wbnns) | https://github.com/wbnns/awesome-base | Base ecosystem dApps/projects list |
| coinbase/x402 Discussions | https://github.com/coinbase/x402 | Showcase as community project |
| Electric Capital open-dev-data | https://github.com/electric-capital/crypto-ecosystems | Gets tracked in developer reports -- add .toml file |
| Base Ecosystem Page | https://www.base.org/ecosystem | Share on Farcaster /base first |
| Alchemy Dapp Store | https://www.alchemy.com/dapps | Submit for listing |
| RootData | https://www.rootdata.com/Projects/submit | Tag with x402 and Base |
| Product Hunt | https://www.producthunt.com/ | Launch in web3 category |
| Web3Scout | https://web3scout.cryptechie.com/ | "Product Hunt for Crypto" |
| GitHub Topics x402 | https://github.com/topics/x402 | Add topic to repo (done) |

---

## Part 5: Hackathons & Events (Ongoing)

### 5.1 Upcoming Events to Target

| Event | Date | Prize Pool | Notes |
|-------|------|-----------|-------|
| ETHGlobal Cannes | Apr 3-5, 2026 | TBD | Base typically sponsors bounties |
| ETHGlobal New York | Jun 12-14, 2026 | TBD | Major event |
| ETHGlobal Lisbon | Jul 24-26, 2026 | TBD | |
| ETHGlobal Tokyo | Sep 25-27, 2026 | TBD | |

### 5.2 Hackathon Strategy

Instead of just competing, **sponsor a bounty track** at smaller hackathons:

- Offer $500-$2K for "Best use of x402charity" at DoraHacks or local events
- Provide a hackathon starter template repo (pre-configured with x402charity)
- Show up as mentors in the Discord/Telegram during the event
- Turn winning projects into case studies and blog posts

This creates real integrations, tutorial content, and invested community members as byproducts.

### 5.3 Create Permanent GitHub Bounties

Label issues with "good first issue" and attach small bounties ($25-$100):
- Add a new charity to the registry
- Write an integration example
- Build a demo app

Use Gitcoin or direct payment. This drives contributions and creates champions for the project.

---

## Part 6: Media & PR (Weeks 6-12)

### 6.1 Priority Media Targets

**Crypto-Native:**
| Outlet | Angle |
|--------|-------|
| CoinDesk | "Programmable giving: how x402 makes micro-donations native to HTTP" |
| The Block | x402 ecosystem story -- new use cases beyond API payments |
| Decrypt | Consumer-friendly explainer of micro-donations |

**Crypto Philanthropy Specialists:**
| Outlet | Angle |
|--------|-------|
| Crypto Altruists (cryptoaltruists.com) | THE dedicated platform for crypto + social impact; blog, podcast, newsletter |
| Chronicle of Philanthropy | "New developer tool brings programmable giving to every web app" |
| NonProfit Times | Stablecoin micro-donations as a new revenue channel for nonprofits |

**Developer Outlets:**
| Outlet | Angle |
|--------|-------|
| dev.to | Tutorial: "Adding charitable micro-donations to your Express app" |
| Coinbase Developer Blog | Guest post showing x402charity integration (reach out to DevRel) |

### 6.2 The Narrative

The core pitch for media:

> Crypto donations hit $2B in 2025, but they still require a conscious decision from the donor. x402charity flips this: developers embed micro-donations into their apps so giving happens automatically, in the background, on every user action. A DEX donates $0.0001 on every trade. A SaaS app donates on every subscription. The user doesn't even notice -- but collectively, it adds up. Built on Coinbase's x402 protocol with USDC on Base, where transaction costs are less than $0.001.

---

## Part 7: Metrics to Track

| Metric | Tool | Target (90 days) |
|--------|------|----------|
| GitHub stars | GitHub | 200+ |
| npm weekly downloads | npm | 100+ |
| Charity registry entries | Internal | 10+ verified charities |
| Total donations processed | On-chain | First 100 transactions |
| Blog post views | Analytics | 5,000+ |
| Discord/community members | Discord | 50+ |
| Hackathon integrations | Manual | 5+ |

---

## Part 8: Competitive Landscape

### Why x402charity Is Unique

| Feature | x402charity | The Giving Block | Endaoment | Superfluid | Gitcoin |
|---------|------------|-------------------|-----------|------------|---------|
| Automated micro-donations | Yes | No (manual) | No (manual) | Partial (streaming) | No |
| Developer middleware | Yes | No | No | No | No |
| USDC on Base | Yes | Multi-chain | Multi-chain | Multi-chain | Multi-chain |
| npm package | Yes | No | No | Yes | No |
| Sub-cent donations viable | Yes (Base L2 fees) | No (min ~$5) | No (min varies) | Yes | No |
| Fire-and-forget (non-blocking) | Yes | N/A | N/A | No | N/A |

### The Unfilled Gap

No major project is doing **automated, programmatic micro-donations to charity on Base using USDC**. Superfluid does streaming but requires setup per stream. The Giving Block and Endaoment require conscious donor action. x402charity makes giving an invisible side-effect of any HTTP event. This is the positioning to own.

---

## Appendix: Key Links & Resources

### x402 Ecosystem
- x402 Protocol: https://www.x402.org/
- x402 GitHub: https://github.com/coinbase/x402 (~5.4K stars)
- x402 Docs: https://docs.cdp.coinbase.com/x402/welcome
- x402 Specification: https://github.com/coinbase/x402/blob/main/specs/x402-specification.md
- x402 V2 (Dec 2025): Multi-chain, dynamic recipients, wallet identity
- x402 Foundation (Sep 2025): Coinbase + Cloudflare governance body

### Base Ecosystem
- Base: https://www.base.org/
- Base Docs: https://docs.base.org/
- Base Get Funded: https://docs.base.org/get-started/get-funded
- Base Batches 2026: https://www.basebatches.xyz/
- OnchainKit: https://github.com/coinbase/onchainkit
- AgentKit: https://github.com/coinbase/agentkit

### Crypto Philanthropy Market
- $2B+ crypto donations in 2025 (The Giving Block Annual Report)
- USDC = 44% of all crypto donations (2023 data)
- 70% of Forbes Top 100 Charities accept crypto
- 1,300+ global nonprofits accept crypto
- GENIUS Act (July 2025) established federal stablecoin regulation
- Average crypto donation: ~$10,500 vs ~$128 average cash gift (82-128x more)

### Grant Programs
- CDP Builder Grants: https://www.coinbase.com/developer-platform/discover/launches
- Base Builder Grants: https://docs.base.org/get-started/get-funded
- CDP AI Builder Grants: https://www.coinbase.com/developer-platform/discover/launches/ai-builder-grants
- Gitcoin Grants: https://gitcoin.co/
- OP RetroPGF: Referenced at Base funding page

### Community Channels
- Build on Base Discord: https://discord.com/invite/buildonbase (539K+)
- Coinbase CDP Discord: https://discord.com/invite/cdp (22K+)
- AgentPay x402 Discord: https://discord.com/invite/uEmcWj8xMX (42K+)
- Farcaster: /base and /base-builds channels
- @buildonbase on X
- @CoinbaseDev on X
