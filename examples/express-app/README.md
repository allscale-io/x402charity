# x402 Charity - Express Example

This is a minimal example of how to integrate micro-donations into an Express.js application using the `x402charity` middleware.

## How it works

The middleware is applied to the `/api` route. Every `POST` request to any sub-route of `/api` will trigger a $0.001 donation to the configured charity.

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set environment variables:
   - `DONATION_PRIVATE_KEY`: Private key of the wallet funding donations.
   - `DONATE_ENDPOINT`: URL of your deployed x402 charity server (default: `http://localhost:3402/donate`).

3. Run the app:
   ```bash
   pnpm start
   ```

## Testing

Trigger a donation by making a POST request:
```bash
curl -X POST http://localhost:3000/api/action
```
