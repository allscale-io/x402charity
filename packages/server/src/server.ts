import { resolve } from 'node:path';
import express, { type Express } from 'express';
import {
  createPublicClient,
  http,
  erc20Abi,
  formatUnits,
  formatEther,
  parseAbiItem,
} from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { paymentMiddlewareFromConfig } from '@x402/express';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { X402CharityClient, listCharities, setCharities } from 'x402charity';
import type { Charity } from 'x402charity';

const USDC_ADDRESSES: Record<string, `0x${string}`> = {
  base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  'base-sepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
};

const CAIP2: Record<string, string> = {
  base: 'eip155:8453',
  'base-sepolia': 'eip155:84532',
};

const EXPLORER_URLS: Record<string, string> = {
  base: 'https://basescan.org',
  'base-sepolia': 'https://sepolia.basescan.org',
};

interface DonationLog {
  txHash: string;
  from: string;
  to: string;
  charityId: string;
  charityName: string;
  amount: string;
  currency: string;
  chain: string;
  timestamp: number;
  status: 'ok' | 'failed';
  error?: string;
}

export interface ServerOptions {
  /** Port to listen on. Default: 3402 */
  port?: number;
  /** Private key for the server's donation wallet (hex string). */
  privateKey?: string;
  /** Network to use. Default: base-sepolia */
  network?: 'base' | 'base-sepolia';
  /** Path to the docs directory for serving static pages. */
  docsDir?: string;
  /** Charity wallet address. */
  charityWallet?: string;
  /** Charity name. */
  charityName?: string;
}

/**
 * Resolve the single charity from env vars or registry.
 */
function resolveCharity(options: ServerOptions, network: string): Charity {
  const charityWallet = options.charityWallet || process.env.CHARITY_WALLET;
  const charityName = options.charityName || process.env.CHARITY_NAME || 'My Charity';
  const baseUrl = process.env.BASE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3402');

  if (charityWallet) {
    if (!/^0x[a-fA-F0-9]{40}$/.test(charityWallet)) {
      throw new Error(`Invalid CHARITY_WALLET address: "${charityWallet}". Must be a 0x-prefixed 40-character hex string.`);
    }
    const charity: Charity = {
      id: charityName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: charityName,
      description: process.env.CHARITY_DESCRIPTION || `Donations to ${charityName}`,
      walletAddress: charityWallet,
      chain: network as 'base' | 'base-sepolia',
      verified: false,
      x402Endpoint: `${baseUrl}/donate`,
    };
    setCharities([charity]);
    return charity;
  }

  // Fall back to first charity in registry
  const charities = listCharities();
  if (charities.length === 0) {
    throw new Error('No charity configured. Set CHARITY_WALLET env var.');
  }
  return charities[0];
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
  } = options;

  const charity = resolveCharity(options, network);

  const explorerUrl = EXPLORER_URLS[network];

  // Set up wallet for server-side x402 client (trigger-donate endpoint)
  let account: ReturnType<typeof privateKeyToAccount> | null = null;
  let donationClient: X402CharityClient | null = null;
  if (privateKey) {
    try {
      const pk = (privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`) as `0x${string}`;
      account = privateKeyToAccount(pk);
      donationClient = new X402CharityClient({
        privateKey,
        network,
        donateEndpoint: charity.x402Endpoint,
        charity,
      });
      console.log('\n=== Donation Wallet ===');
      console.log(`  Address: ${account.address}`);
      console.log(`  Network: ${network}`);
      console.log(`  Fund this address with USDC and ETH (for gas) on ${network === 'base' ? 'Base' : 'Base Sepolia'}`);
      console.log(`  Explorer: ${explorerUrl}/address/${account.address}\n`);
    } catch (err) {
      console.error('Failed to initialize donation wallet:', err instanceof Error ? err.message : err);
    }
  }

  console.log(`=== Charity: ${charity.name} ===`);
  console.log(`  Wallet: ${charity.walletAddress}\n`);

  const donateApiKey = process.env.DONATE_API_KEY || '';
  if (donateApiKey) {
    console.log('=== API Key ===');
    console.log(`  POST /donate is protected by DONATE_API_KEY\n`);
  } else {
    console.warn('WARNING: DONATE_API_KEY not set — POST /donate is open to anyone. Set it in production.\n');
  }

  const app = express();
  app.use(express.json());

  // CORS — allow any origin for read-only GET endpoints (dashboard, public data).
  // POST /donate is server-to-server (not browser-initiated), so CORS doesn't
  // add protection there. The x402 payment signature is the access control.
  const allowedOrigins = process.env.CORS_ORIGINS?.split(',').map(s => s.trim());
  app.use((req, res, next) => {
    const origin = req.headers.origin || '';
    if (allowedOrigins) {
      if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
      }
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Payment, Payment-Signature');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  // --- Static pages ---
  // On Vercel, static files are served by the platform before Express sees the request.
  // This route is only used for local/Docker development.
  const docsDir = options.docsDir || resolve(process.cwd(), 'docs');

  app.get('/', (_req, res) => res.sendFile(resolve(docsDir, 'index.html')));

  // --- x402 payment middleware ---
  const caip2 = CAIP2[network];
  const routes = {
    'GET /donate': {
      accepts: {
        scheme: 'exact',
        network: caip2,
        payTo: charity.walletAddress,
        price: '$0.001',
      },
    },
  };

  app.use(
    paymentMiddlewareFromConfig(
      routes as Parameters<typeof paymentMiddlewareFromConfig>[0],
      undefined,
      [{ network: caip2 as `${string}:${string}`, server: new ExactEvmScheme() }],
    ),
  );

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      charity: { name: charity.name, wallet: charity.walletAddress },
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
        const client = createPublicClient({ chain, transport: http(rpc, { timeout: 15_000 }) });
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

  // Charity info with balances
  app.get('/charity', async (_req, res) => {
    const charityAddr = charity.walletAddress as `0x${string}`;
    const chains = {
      base: { chain: base, rpc: 'https://mainnet.base.org' },
      'base-sepolia': { chain: baseSepolia, rpc: 'https://sepolia.base.org' },
    };

    const balances: Record<string, { eth: string; usdc: string }> = {};

    await Promise.all(
      Object.entries(chains).map(async ([name, { chain: c, rpc }]) => {
        try {
          const client = createPublicClient({ chain: c, transport: http(rpc) });
          const [ethBal, usdcBal] = await Promise.all([
            client.getBalance({ address: charityAddr }),
            client.readContract({
              address: USDC_ADDRESSES[name],
              abi: erc20Abi,
              functionName: 'balanceOf',
              args: [charityAddr],
            }),
          ]);
          balances[name] = {
            eth: formatEther(ethBal),
            usdc: formatUnits(usdcBal, 6),
          };
        } catch {
          balances[name] = { eth: '0', usdc: '0' };
        }
      }),
    );

    res.json({
      name: charity.name,
      description: charity.description,
      walletAddress: charity.walletAddress,
      chain: charity.chain,
      balances,
    });
  });

  // Donation history API — fetches on-chain USDC transfers from both networks
  // Accepts ?daysAgo=N to scan a single day's worth of blocks (default: 0 = today)
  app.get('/donations', async (req, res) => {
    const charityAddr = charity.walletAddress as `0x${string}`;
    const daysAgo = Math.min(365, Math.max(0, parseInt(req.query.daysAgo as string) || 0));

    const transferEvent = parseAbiItem(
      'event Transfer(address indexed from, address indexed to, uint256 value)',
    );

    const chains = [
      { name: 'base' as const, chain: base, rpc: 'https://mainnet.base.org', explorer: 'https://basescan.org' },
      { name: 'base-sepolia' as const, chain: baseSepolia, rpc: 'https://sepolia.base.org', explorer: 'https://sepolia.basescan.org' },
    ];

    const CHUNK_SIZE = 9999n;
    const BLOCKS_PER_DAY = 43200n; // ~24h at ~2s/block on Base
    const BATCH_CONCURRENCY = 10;

    const onChainDonations: DonationLog[] = [];

    await Promise.all(chains.map(async ({ name, chain, rpc }) => {
      try {
        const client = createPublicClient({ chain, transport: http(rpc, { timeout: 15_000 }) });
        const currentBlock = await client.getBlockNumber();

        const endBlock = currentBlock - BigInt(daysAgo) * BLOCKS_PER_DAY;
        let startBlock = endBlock - BLOCKS_PER_DAY;
        if (startBlock < 0n) startBlock = 0n;

        // Build chunk ranges
        const chunks: { from: bigint; to: bigint }[] = [];
        for (let from = startBlock; from <= endBlock; from += CHUNK_SIZE + 1n) {
          const to = from + CHUNK_SIZE > endBlock ? endBlock : from + CHUNK_SIZE;
          chunks.push({ from, to });
        }

        // Fetch logs in batched parallel to respect RPC rate limits
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allLogs: any[] = [];
        for (let i = 0; i < chunks.length; i += BATCH_CONCURRENCY) {
          const batch = chunks.slice(i, i + BATCH_CONCURRENCY);
          const results = await Promise.all(
            batch.map(({ from, to }) =>
              client.getLogs({
                address: USDC_ADDRESSES[name],
                event: transferEvent,
                args: { to: charityAddr },
                fromBlock: from,
                toBlock: to,
              }).catch(() => []),
            ),
          );
          for (const logs of results) {
            allLogs.push(...logs);
          }
        }

        // Estimate timestamps from block numbers (avoids getBlock RPC calls)
        const currentTimestamp = Date.now();
        const BLOCK_TIME_MS = 2000; // ~2s per block on Base

        for (const log of allLogs) {
          const amount = formatUnits(log.args.value ?? 0n, 6);
          const blockDiff = Number(currentBlock - log.blockNumber!);
          const estimatedTimestamp = currentTimestamp - blockDiff * BLOCK_TIME_MS;
          onChainDonations.push({
            txHash: log.transactionHash ?? '',
            from: (log.args.from as string) ?? '',
            to: (log.args.to as string) ?? '',
            charityId: charity.id,
            charityName: charity.name,
            amount: `$${amount}`,
            currency: 'USDC',
            chain: name,
            timestamp: estimatedTimestamp,
            status: 'ok',
          });
        }
      } catch (err) {
        console.error(`Failed to fetch on-chain donations (${name}):`, err instanceof Error ? err.message : err);
      }
    }));

    const all = onChainDonations.sort((a, b) => b.timestamp - a.timestamp);
    const total = all.reduce((sum, d) => sum + parseFloat(d.amount.replace('$', '')), 0);

    res.json({
      total: `$${total.toFixed(4)}`,
      count: all.length,
      network,
      explorerUrl,
      donations: all,
    });
  });

  // x402-gated donation endpoint — runs after payment is verified by middleware
  app.get('/donate', (_req, res) => {
    res.json({
      status: 'ok',
      message: `Donated to ${charity.name}`,
      receipt: {
        to: charity.walletAddress,
        amount: '$0.001',
        currency: 'USDC',
        chain: network,
        timestamp: Date.now(),
      },
    });
  });

  // Donation queue — serializes x402 payments to avoid nonce conflicts
  let donationQueue: Promise<void> = Promise.resolve();
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 1000;

  // Trigger endpoint — server pays from its own wallet via x402 protocol
  app.post('/donate', async (req, res) => {
    // API key auth — if DONATE_API_KEY is set, require Authorization: Bearer <key>
    if (donateApiKey) {
      const authHeader = req.headers.authorization || '';
      if (!authHeader.startsWith('Bearer ') || authHeader.slice(7) !== donateApiKey) {
        res.status(401).json({ error: 'Unauthorized. Provide a valid Authorization: Bearer <DONATE_API_KEY> header.' });
        return;
      }
    }

    if (!donationClient) {
      res.status(503).json({
        error: 'Donation wallet not configured. Set DONATION_PRIVATE_KEY env var.',
      });
      return;
    }

    // Validate amount format: must be $N.NN with reasonable bounds
    const rawAmount = req.body?.amount || '$0.001';
    if (typeof rawAmount !== 'string' || !/^\$?\d+(\.\d+)?$/.test(rawAmount)) {
      res.status(400).json({ error: 'Invalid amount format. Use e.g. "$0.001" or "0.001".' });
      return;
    }
    const numericValue = parseFloat(rawAmount.replace('$', ''));
    if (numericValue <= 0 || numericValue > 100) {
      res.status(400).json({ error: 'Amount must be between $0.001 and $100.' });
      return;
    }
    const amount = rawAmount.startsWith('$') ? rawAmount : `$${rawAmount}`;

    // Await the queue so the response is sent from within this handler
    await new Promise<void>((resolveQueue) => {
      donationQueue = donationQueue.then(async () => {
        let lastError = '';
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          try {
            if (attempt > 0) {
              await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
            }
            const receipt = await donationClient!.donate(amount);
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
            resolveQueue();
            return;
          } catch (err) {
            lastError = err instanceof Error ? err.message : 'Unknown error';
            console.error(`Donation attempt ${attempt + 1}/${MAX_RETRIES} failed:`, lastError);
          }
        }
        res.status(500).json({ error: 'Donation failed', details: lastError });
        resolveQueue();
      });
    });
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
    console.log(`x402 Charity Server running on http://localhost:${port}\n`);
    console.log('Endpoints:');
    console.log(`  GET  /health              — health check`);
    console.log(`  GET  /address             — donation wallet address & balances`);
    console.log(`  GET  /charity             — charity info`);
    console.log(`  GET  /donations           — donation history (JSON)`);
    console.log(`  GET  /                    — landing page with dashboard`);
    console.log(`  POST /donate              — trigger a donation\n`);
  });
}
