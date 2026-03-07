# x402charity — Deployment Issues & Recommended Fixes

This document covers bugs and design issues found when deploying [x402charity](https://github.com/allscale-io/x402charity) to Vercel.

---

## Bugs

### 1. Undocumented `BASE_URL` Environment Variable

**File:** `packages/server/src/server.ts:68`

```ts
const baseUrl = process.env.BASE_URL || 'http://localhost:3402';
```

The `POST /donate` endpoint works by having the server call its own `GET /donate` endpoint via the x402 protocol. The URL it calls is constructed from `BASE_URL`, which defaults to `http://localhost:3402`. On any cloud deployment (Vercel, Railway, Fly, etc.), `localhost:3402` does not exist, so every donation request fails with `"fetch failed"`.

The README lists 6 environment variables. `BASE_URL` is not one of them. A user following the docs exactly will deploy successfully but donations will silently fail.

**Fix:** Auto-detect the URL on Vercel using the `VERCEL_URL` system variable, and add `BASE_URL` to the README for other platforms:

```ts
const baseUrl = process.env.BASE_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3402');
```

---

### 2. Dockerfile References Non-Existent Packages

**File:** `Dockerfile:10-12`

```dockerfile
COPY packages/cli/package.json packages/cli/
COPY packages/express/package.json packages/express/
COPY packages/next/package.json packages/next/
```

The directories `packages/cli/`, `packages/express/`, and `packages/next/` do not exist in the repository. Running `docker build` fails immediately with a COPY error. This means the Docker deployment path documented in the README is completely broken.

**Fix:** Remove the three lines referencing non-existent packages:

```dockerfile
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/core/package.json packages/core/
COPY packages/server/package.json packages/server/
```

---

### 3. In-Memory Donation Log Is Lost on Serverless

**File:** `packages/server/src/server.ts`

```ts
const donationLog: DonationLog[] = [];
```

Vercel serverless functions are stateless — each request can spin up a fresh instance. The in-memory `donationLog` array is lost between requests. Failed donations or those without transaction hashes disappear permanently. The `/donations` endpoint partially compensates by querying on-chain USDC transfer events, but any data not on-chain is silently lost.

**Fix (option A):** Remove the in-memory log entirely and rely solely on the on-chain query that already exists in the `/donations` handler.

**Fix (option B):** Add a lightweight persistent store (Vercel KV, Upstash Redis, or a database) for donation records.

---

## Design Issues

### 4. Self-Calling Circular Architecture

The `POST /donate` handler makes the server send an HTTP request to its own `GET /donate` endpoint through the x402 protocol. This creates several problems:

- **Requires knowing its own public URL** — introduces the `BASE_URL` dependency (issue #1).
- **Double cold start on serverless** — the outbound fetch may trigger a second Vercel function invocation, doubling startup latency.
- **Extra network round-trip** — the request goes out to the internet and back to the same server, adding unnecessary latency.
- **Timeout risk** — the x402 payment signing + self-call + on-chain settlement chain can exceed Vercel's default 10-second function timeout.

**Fix:** Perform the x402 payment directly in the `POST /donate` handler instead of making a round-trip HTTP call to itself. This eliminates the `BASE_URL` dependency and roughly halves the request latency.

---

### 5. No Vercel Function Timeout Configuration

The donation flow involves blockchain transactions (signing, submitting, waiting for settlement). The default Vercel serverless function timeout is 10 seconds, which can be too short for on-chain operations.

**Fix:** Add a `maxDuration` to `vercel.json`:

```json
{
  "functions": {
    "api/index.ts": {
      "maxDuration": 30
    }
  }
}
```

---

### 6. Express Static File Serving Is Dead Code on Vercel

**File:** `packages/server/src/server.ts:133`

```ts
app.get('/', (_req, res) => res.sendFile(resolve(docsDir, 'index.html')));
```

This route tries to serve `docs/index.html` via Express's `sendFile`. On Vercel, the build command in `vercel.json` copies the file to `public/index.html`, and Vercel's built-in static serving handles it before Express ever sees the request. The Express route for `/` is effectively dead code on Vercel.

This is not a bug (the page loads fine), but it is confusing — the code suggests Express serves the landing page, when in reality Vercel's static layer does.

**Fix:** No code change strictly required. Add a comment clarifying the Vercel behavior, or conditionally skip the route when `process.env.VERCEL` is set.

---

### 7. Incomplete Vercel Deployment Documentation

The README's "Deploy on Vercel" section says:

> 1. Fork this repo
> 2. Import it in Vercel
> 3. Set the environment variables in your Vercel project settings
> 4. Deploy

It does not mention:
- The `BASE_URL` variable needed for donations to work
- That the donation wallet must be funded with both USDC and ETH (for gas) on the correct network
- That `base-sepolia` is the default network (testnet), which requires testnet USDC
- How to get testnet USDC (e.g. Circle faucet at https://faucet.circle.com/)

**Fix:** Expand the Vercel section with the complete list of required steps, including `BASE_URL` (or auto-detect it per fix #1) and wallet funding instructions.

---

## Summary

| # | Type | Severity | Issue | Deployable? |
|---|------|----------|-------|-------------|
| 1 | Bug | **High** | `BASE_URL` not documented, defaults to localhost | Deploys but donations fail |
| 2 | Bug | **High** | Dockerfile references 3 non-existent packages | Docker build fails |
| 3 | Bug | Medium | In-memory log lost on serverless | Data loss on Vercel |
| 4 | Design | Medium | Server calls itself via HTTP | Fragile, slow, timeout-prone |
| 5 | Design | Medium | No Vercel function timeout config | Donations may time out |
| 6 | Design | Low | Dead Express route on Vercel | Cosmetic / confusing |
| 7 | Docs | Medium | Vercel deploy steps incomplete | Users can't follow docs to success |
