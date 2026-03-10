# x402charity Express Example

This example demonstrates how to use x402charity middleware in an Express.js application.

## Setup

```bash
npm install
```

## Configuration

Set environment variables:

```bash
export DONATION_PRIVATE_KEY=0x...  # Your wallet private key
export DONATE_ENDPOINT=https://x402charity.com/donate  # Or your own server
```

## Run

```bash
npm start
```

Server will start at http://localhost:3000

## Test

```bash
curl -X POST http://localhost:3000/api/purchase
```

Expected response:
```json
{
  "success": true,
  "message": "Purchase completed! A $0.001 donation was triggered.",
  "charity": "Testing Charity"
}
```

## How It Works

1. The middleware is applied to `/api/*` routes
2. When a POST request hits `/api/*`, a donation is triggered
3. The donation happens asynchronously without blocking the response
4. Your users get a seamless experience while donations happen in the background