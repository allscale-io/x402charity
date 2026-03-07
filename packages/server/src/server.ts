import express, { type Express } from 'express';
import { X402CharityClient, listCharities, findCharity } from '@x402charity/core';
import type { Charity } from '@x402charity/core';

export interface ServerOptions {
  /** Port to listen on. Default: 3402 */
  port?: number;
  /** Private key for the server's donation wallet (hex string). */
  privateKey?: string;
  /** Network to use. Default: base-sepolia */
  network?: 'base' | 'base-sepolia';
  /** Only serve charities matching these IDs. Default: all charities. */
  charityIds?: string[];
}

/**
 * Create the Express app that donates on behalf of users using the server's own wallet.
 */
export function createCharityServer(options: ServerOptions = {}): {
  app: Express;
} {
  const {
    privateKey = process.env.DONATION_PRIVATE_KEY || '',
    network = (process.env.DONATION_NETWORK as 'base' | 'base-sepolia') || 'base-sepolia',
    charityIds,
  } = options;

  let charities = listCharities();
  if (charityIds) {
    charities = charities.filter((c) => charityIds.includes(c.id));
  }

  if (charities.length === 0) {
    throw new Error('No charities found. Add charities to the registry first.');
  }

  // Only create the client if we have a private key (allows health/charities endpoints without it)
  let donationClient: X402CharityClient | null = null;
  if (privateKey) {
    donationClient = new X402CharityClient({ privateKey, network });
  }

  const app = express();
  app.use(express.json());

  // CORS
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      charities: charities.length,
      walletConfigured: !!donationClient,
      donationWallet: donationClient?.account.address ?? null,
    });
  });

  // List available charities
  app.get('/charities', (_req, res) => {
    res.json(
      charities.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        walletAddress: c.walletAddress,
        chain: c.chain,
        verified: c.verified,
      })),
    );
  });

  // Donate endpoint — server pays from its own wallet
  app.post('/donate/:charityId', async (req, res) => {
    const { charityId } = req.params;

    if (!donationClient) {
      res.status(503).json({
        error: 'Donation wallet not configured. Set DONATION_PRIVATE_KEY env var.',
      });
      return;
    }

    const charity = findCharity(charityId);
    if (!charity) {
      res.status(404).json({ error: `Charity not found: ${charityId}` });
      return;
    }

    try {
      const amount = req.body?.amount || '$0.01';
      const receipt = await donationClient.donate(charityId, amount);
      res.json({
        status: 'ok',
        message: `Donated to ${charity.name}`,
        receipt: {
          txHash: receipt.txHash,
          from: receipt.from,
          to: receipt.to,
          amount: receipt.amount,
          currency: receipt.currency,
          chain: receipt.chain,
          timestamp: receipt.timestamp,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Donation to ${charityId} failed:`, message);
      res.status(500).json({ error: 'Donation failed', details: message });
    }
  });

  return { app };
}

/**
 * Start the charity server on the given port.
 */
export function startCharityServer(options: ServerOptions = {}): void {
  const port = options.port || 3402;
  const { app } = createCharityServer(options);

  app.listen(port, () => {
    console.log(`\nx402 Charity Server running on http://localhost:${port}\n`);
    console.log('Endpoints:');
    console.log(`  GET  /health          — health check`);
    console.log(`  GET  /charities       — list available charities`);
    console.log(`  POST /donate/:id      — donate (server pays via x402)\n`);
  });
}
