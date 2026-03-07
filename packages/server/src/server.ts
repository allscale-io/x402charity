import { resolve } from 'node:path';
import express, { type Express } from 'express';
import {
  createPublicClient,
  http,
  erc20Abi,
  formatUnits,
  formatEther,
} from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { paymentMiddlewareFromConfig } from '@x402/express';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { X402CharityClient, listCharities, findCharity } from '@x402charity/core';

const USDC_ADDRESSES: Record<string, `0x${string}`> = {
  base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  'base-sepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
};

const CAIP2: Record<string, string> = {
  base: 'eip155:8453',
  'base-sepolia': 'eip155:84532',
};

export interface ServerOptions {
  /** Port to listen on. Default: 3402 */
  port?: number;
  /** Private key for the server's donation wallet (hex string). */
  privateKey?: string;
  /** Network to use. Default: base-sepolia */
  network?: 'base' | 'base-sepolia';
  /** Only serve charities matching these IDs. Default: all charities. */
  charityIds?: string[];
  /** Path to the docs directory for serving static pages. */
  docsDir?: string;
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

  // Set up wallet for server-side x402 client (trigger-donate endpoint)
  let account: ReturnType<typeof privateKeyToAccount> | null = null;
  let donationClient: X402CharityClient | null = null;
  if (privateKey) {
    try {
      const pk = (privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`) as `0x${string}`;
      account = privateKeyToAccount(pk);
      donationClient = new X402CharityClient({ privateKey, network });
    } catch (err) {
      console.error('Failed to initialize donation wallet:', err instanceof Error ? err.message : err);
    }
  }

  const app = express();
  app.use(express.json());

  // CORS
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Payment, Payment-Signature');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  // --- Static pages ---
  const docsDir = options.docsDir || resolve(process.cwd(), 'docs');

  app.get('/', (_req, res) => res.sendFile(resolve(docsDir, 'index.html')));

  // --- x402 payment middleware ---
  // Gate GET /donate/<charityId> behind x402 paywall.
  // Payment goes from caller's wallet to charity's wallet via the facilitator.
  const caip2 = CAIP2[network];
  const routes: Record<string, object> = {};
  for (const charity of charities) {
    routes[`GET /donate/${charity.id}`] = {
      accepts: {
        scheme: 'exact',
        network: caip2,
        payTo: charity.walletAddress,
        price: '$0.001',
      },
    };
  }

  app.use(
    paymentMiddlewareFromConfig(
      routes as Parameters<typeof paymentMiddlewareFromConfig>[0],
      undefined, // use default facilitator
      [{ network: caip2 as `${string}:${string}`, server: new ExactEvmScheme() }],
    ),
  );

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      charities: charities.length,
      walletConfigured: !!account,
      donationWallet: account?.address ?? null,
    });
  });

  // Public address and balances of the donation wallet
  app.get('/address', async (_req, res) => {
    if (!account) {
      res.status(503).json({ error: 'Donation wallet not configured.' });
      return;
    }

    const address = account.address;
    const chains = {
      base: { chain: base, rpc: 'https://mainnet.base.org' },
      'base-sepolia': { chain: baseSepolia, rpc: 'https://sepolia.base.org' },
    };

    const balances: Record<string, { eth: string; usdc: string }> = {};

    await Promise.all(
      Object.entries(chains).map(async ([name, { chain, rpc }]) => {
        const client = createPublicClient({ chain, transport: http(rpc) });
        const [ethBal, usdcBal] = await Promise.all([
          client.getBalance({ address }),
          client.readContract({
            address: USDC_ADDRESSES[name],
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [address],
          }),
        ]);
        balances[name] = {
          eth: formatEther(ethBal),
          usdc: formatUnits(usdcBal, 6),
        };
      }),
    );

    res.json({ address, balances });
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

  // x402-gated donation endpoint — runs after payment is verified by middleware
  app.get('/donate/:charityId', (req, res) => {
    const charity = findCharity(req.params.charityId);
    res.json({
      status: 'ok',
      message: `Donated to ${charity?.name}`,
      receipt: {
        to: charity?.walletAddress,
        amount: '$0.01',
        currency: 'USDC',
        chain: network,
        timestamp: Date.now(),
      },
    });
  });

  // Trigger endpoint — server pays from its own wallet via x402 protocol
  // The demo page calls this; the server acts as x402 client.
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
    console.log(`  GET  /health              — health check`);
    console.log(`  GET  /address             — donation wallet address & balances`);
    console.log(`  GET  /charities           — list available charities`);
    console.log(`  GET  /donate/:id          — x402-gated donation endpoint`);
    console.log(`  POST /donate/:id          — trigger donation (server pays via x402)\n`);
  });
}
