# x402charity Express Example

A minimal Express app demonstrating the x402charity middleware for automatic micro-donations.

## Features

- Express server with x402charity middleware
- Demonstrates HTTP 402 (Payment Required) protocol for optional donations
- Uses Base Sepolia testnet
- Simple API endpoints

## Setup

```bash
# Install dependencies
npm install

# Start the server
npm start
```

## Usage

```bash
# Start the server
npm start

# Test the API endpoints
curl http://localhost:3000/api/hello
curl http://localhost:3000/api/data
```

## How it works

The `x402Middleware` adds HTTP 402 (Payment Required) support to your Express routes. When a client includes payment credentials, a small portion of the request payment can be directed to charity automatically.

This enables:
- Optional micro-donations on API calls
- Seamless charity support without friction
- Integration with the x402 protocol

## Learn more

- [x402charity](https://x402charity.com)
- [x402 Protocol](https://x402.org)
- [Base Network](https://base.org)
