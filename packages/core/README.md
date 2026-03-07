# x402charity

[![npm](https://img.shields.io/npm/v/x402charity)](https://www.npmjs.com/package/x402charity)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://x402charity.com)

Add micro-donations to any product with a single line of code. Powered by the [x402 protocol](https://www.x402.org/) — every user action triggers a USDC donation on Base.

**[Live Demo](https://x402charity.com)** | **[GitHub](https://github.com/allscale-io/x402charity)** | **[Deploy Your Own Server](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fallscale-io%2Fx402charity&env=DONATION_PRIVATE_KEY,CHARITY_WALLET&envDescription=DONATION_PRIVATE_KEY%3A%20private%20key%20of%20wallet%20funding%20donations.%20CHARITY_WALLET%3A%20wallet%20address%20of%20the%20charity.&project-name=x402charity&repository-name=x402charity)**

## Install

```bash
npm install x402charity
```

## Quick Start

### Express Middleware

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

### Next.js Middleware

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

### Programmatic Client

```js
import { X402CharityClient } from 'x402charity';

const client = new X402CharityClient({
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
});

const receipt = await client.donate('$0.001');
console.log(receipt.txHash); // on-chain proof
```

### CLI

```bash
npx x402charity donate testing-charity '$0.001' --network base-sepolia
```

## How It Works

1. Your server calls a deployed x402 charity server's `POST /donate` endpoint
2. The charity server uses the x402 protocol to sign a USDC payment
3. The x402 facilitator (operated by Coinbase) settles the payment on Base
4. Your server gets back a receipt with the on-chain transaction hash

Users never need a wallet or any crypto knowledge. Your company funds donations from a single pre-funded wallet.

## API

### `X402CharityClient`

```ts
new X402CharityClient(options: ClientOptions)
```

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `privateKey` | `string` | Yes | Private key of the wallet funding donations |
| `donateEndpoint` | `string` | Yes | URL of the x402-gated donation endpoint |
| `charity` | `Charity` | Yes | Charity receiving donations |
| `network` | `'base' \| 'base-sepolia'` | No | Network to use (default: `base-sepolia`) |

#### `client.donate(amount?: string): Promise<DonationReceipt>`

Triggers a donation. Default amount is `$0.001`.

### Express Middleware Options

All `ClientOptions` plus:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `amount` | `string` | `'$0.001'` | Donation amount per request |
| `silent` | `boolean` | `true` | Suppress error logs |
| `shouldDonate` | `(req) => boolean` | — | Filter which requests trigger donations |

### Next.js Middleware Options

All `ClientOptions` plus:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `amount` | `string` | `'$0.001'` | Donation amount per request |
| `silent` | `boolean` | `true` | Suppress error logs |
| `matcher` | `string \| string[]` | — | URL patterns to match (e.g. `'/api/*'`) |

## Server Setup

This package is the client SDK. You also need a running x402 charity server to receive donations. See the [GitHub repo](https://github.com/allscale-io/x402charity) for server setup, or deploy one instantly:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fallscale-io%2Fx402charity&env=DONATION_PRIVATE_KEY,CHARITY_WALLET&envDescription=DONATION_PRIVATE_KEY%3A%20private%20key%20of%20wallet%20funding%20donations.%20CHARITY_WALLET%3A%20wallet%20address%20of%20the%20charity.&project-name=x402charity&repository-name=x402charity)

## License

MIT
