# x402 Charity

[![npm](https://img.shields.io/npm/v/x402charity)](https://www.npmjs.com/package/x402charity)
[![npm downloads](https://img.shields.io/npm/dw/x402charity)](https://www.npmjs.com/package/x402charity)
[![GitHub stars](https://img.shields.io/github/stars/allscale-io/x402charity)](https://github.com/allscale-io/x402charity)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://x402charity.com)

Drop-in Express and Next.js middleware that sends USDC micro-donations to charities on every user action, powered by the [x402 protocol](https://www.x402.org/) on Base.

Built and maintained by [AllScale Lab](https://allscale.io).

## What Is This?

x402 Charity is an open-source middleware that lets any project trigger a small charitable donation whenever a user takes an action — a trade, a subscription, an API call, anything.

The donation happens in the background. No extra steps for the user. No separate donation UI. It's just part of the payment.

## Why x402?

The [x402 protocol](https://www.x402.org/) makes machine-to-machine stablecoin payments native to HTTP. x402 Charity extends that idea: if payments can be programmable, so can giving.

## Example Use Cases

- **DEX or prediction market** — donate $0.0001 USDC every time a user places an order
- **AI SaaS** — donate on every new plan purchase or API call
- **Any x402-enabled app** — attach a cause to any event you already track

## How It Works

```
User action → Your app → x402 Charity middleware → Donation sent via x402
                ↓
         Normal payment continues
```

1. You configure a cause and a micro-donation amount
2. When a qualifying event fires, the middleware sends a stablecoin payment to the charity's x402 endpoint
3. The user's primary transaction is unaffected — the donation is a side-effect

## Quick Start

```bash
npm install x402charity
```

```js
const { x402Charity } = require('x402charity');

const charity = x402Charity({
  cause: 'red-cross',
  amount: '0.0001',     // USDC per event
  currency: 'USDC',
});

// Attach to any event
app.post('/trade', charity.wrap(async (req, res) => {
  // your trade logic here
}));
```

## Configuration

| Option     | Description                          | Default |
|------------|--------------------------------------|---------|
| `cause`    | Charity identifier or wallet address | —       |
| `amount`   | Donation amount per event            | `0.0001`|
| `currency` | Stablecoin to use                    | `USDC`  |
| `network`  | Chain to send on                     | `base`  |
| `silent`   | Suppress donation errors             | `true`  |

## Supported Charities

We're building an open directory of verified charity endpoints. Want to add your organization? Open a PR or reach out.

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

## License

MIT
