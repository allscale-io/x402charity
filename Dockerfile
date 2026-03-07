FROM node:20-slim
RUN corepack enable

WORKDIR /app

# Copy workspace config and all package.jsons for dependency install
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/core/package.json packages/core/
COPY packages/server/package.json packages/server/
COPY packages/cli/package.json packages/cli/
COPY packages/express/package.json packages/express/
COPY packages/next/package.json packages/next/

RUN pnpm install --frozen-lockfile

# Copy source for core and server (only packages needed at runtime)
COPY packages/core/ packages/core/
COPY packages/server/ packages/server/
COPY registry/ registry/
COPY docs/ docs/

RUN pnpm --filter @x402charity/core build && pnpm --filter @x402charity/server build

EXPOSE 3402

# Required: DONATION_PRIVATE_KEY
# Required: CHARITY_WALLET (or use registry/charities.json)
# Optional: CHARITY_NAME, CHARITY_ID, CHARITY_DESCRIPTION
# Optional: DONATION_NETWORK (base or base-sepolia, default: base-sepolia)
# Optional: PORT (default: 3402)
CMD ["node", "packages/server/bin/server.js"]
