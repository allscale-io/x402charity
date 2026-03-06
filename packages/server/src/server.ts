import express, { type Express } from 'express';
import { paymentMiddleware, x402ResourceServer } from '@x402/express';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { HTTPFacilitatorClient } from '@x402/core/server';
import { listCharities, CAIP2_CHAIN_IDS } from '@x402charity/core';
import type { Charity } from '@x402charity/core';

export interface ServerOptions {
  /** Port to listen on. Default: 3402 */
  port?: number;
  /** Override the facilitator URL. Default: https://facilitator.x402.org */
  facilitatorUrl?: string;
  /** Only serve charities matching these IDs. Default: all charities. */
  charityIds?: string[];
}

export interface CharityRoute {
  charityId: string;
  method: string;
  path: string;
  network: string;
  payTo: string;
}

/**
 * Build the x402 payment routes config from the charity registry.
 * Each charity gets a `GET /donate/:id` endpoint gated by a 402 payment.
 */
function buildRoutes(charities: Charity[]) {
  // We build the routes as a plain object keyed by "METHOD /path".
  // The values must satisfy RouteConfig from @x402/core.
  const routes: Record<string, unknown> = {};
  const charityRoutes: CharityRoute[] = [];

  for (const charity of charities) {
    const caip2 = CAIP2_CHAIN_IDS[charity.chain];
    if (!caip2) continue;

    const pattern = `GET /donate/${charity.id}`;
    routes[pattern] = {
      accepts: {
        scheme: 'exact',
        price: '$0.01',
        network: caip2 as `${string}:${string}`,
        payTo: charity.walletAddress,
      },
      description: `Donate to ${charity.name}`,
    };

    charityRoutes.push({
      charityId: charity.id,
      method: 'GET',
      path: `/donate/${charity.id}`,
      network: caip2,
      payTo: charity.walletAddress,
    });
  }

  return { routes, charityRoutes };
}

/**
 * Create the Express app with x402 payment middleware for all registered charities.
 */
export function createCharityServer(options: ServerOptions = {}): {
  app: Express;
  charityRoutes: CharityRoute[];
} {
  const { facilitatorUrl = 'https://x402.org/facilitator', charityIds } = options;

  let charities = listCharities();
  if (charityIds) {
    charities = charities.filter((c) => charityIds.includes(c.id));
  }

  if (charities.length === 0) {
    throw new Error('No charities found. Add charities to the registry first.');
  }

  const { routes, charityRoutes } = buildRoutes(charities);

  // Set up the x402 resource server with EVM support
  const facilitator = new HTTPFacilitatorClient({ url: facilitatorUrl });
  const resourceServer = new x402ResourceServer(facilitator);

  // Register the EVM scheme for each unique network
  const networks = new Set(charityRoutes.map((r) => r.network));
  for (const network of networks) {
    resourceServer.register(network as `${string}:${string}`, new ExactEvmScheme());
  }

  const app = express();

  // CORS — allow the GitHub Pages frontend to call the server
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'X-Payment, Content-Type');
    res.setHeader('Access-Control-Expose-Headers', 'X-Payment');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', charities: charities.length });
  });

  // List available charity endpoints
  app.get('/charities', (_req, res) => {
    res.json(
      charities.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        donateUrl: `/donate/${c.id}`,
        walletAddress: c.walletAddress,
        chain: c.chain,
        verified: c.verified,
      })),
    );
  });

  // x402 payment middleware — gates /donate/:id routes
  // Cast needed because RoutesConfig is a union type (Record<string, RouteConfig> | RouteConfig)
  // and TypeScript can't narrow our object to the Record variant automatically.
  app.use(paymentMiddleware(routes as Parameters<typeof paymentMiddleware>[0], resourceServer));

  // Donation endpoints — only reached after successful x402 payment
  for (const charity of charities) {
    app.get(`/donate/${charity.id}`, (_req, res) => {
      res.json({
        status: 'ok',
        message: `Thank you for your donation to ${charity.name}`,
        charity: {
          id: charity.id,
          name: charity.name,
          walletAddress: charity.walletAddress,
        },
        timestamp: Date.now(),
      });
    });
  }

  return { app, charityRoutes };
}

/**
 * Start the charity server on the given port.
 */
export function startCharityServer(options: ServerOptions = {}): void {
  const port = options.port || 3402;
  const { app, charityRoutes } = createCharityServer(options);

  app.listen(port, () => {
    console.log(`\nx402 Charity Server running on http://localhost:${port}\n`);
    console.log('Endpoints:');
    console.log(`  GET /health      — health check`);
    console.log(`  GET /charities   — list available charities\n`);
    console.log('Donation endpoints (x402-gated):');
    for (const route of charityRoutes) {
      console.log(`  ${route.method} ${route.path}  →  ${route.payTo} (${route.network})`);
    }
    console.log('');
  });
}
