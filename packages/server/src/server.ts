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
import { X402CharityClient, listCharities, setCharities } from '@x402charity/core';
import type { Charity } from '@x402charity/core';

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
  const baseUrl = process.env.BASE_URL || 'http://localhost:3402';

  if (charityWallet) {
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

  // Donation history (in-memory)
  const donationLog: DonationLog[] = [];
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

  // Donation history API — fetches on-chain USDC transfers
  app.get('/donations', async (_req, res) => {
    const charityAddr = charity.walletAddress as `0x${string}`;
    const senderAddr = account?.address;

    const transferEvent = parseAbiItem(
      'event Transfer(address indexed from, address indexed to, uint256 value)',
    );

    // Query on-chain transfers on the active network
    const chainConfig = network === 'base'
      ? { chain: base, rpc: 'https://mainnet.base.org' }
      : { chain: baseSepolia, rpc: 'https://sepolia.base.org' };

    const onChainDonations: DonationLog[] = [];

    try {
      const client = createPublicClient({ chain: chainConfig.chain, transport: http(chainConfig.rpc) });
      const currentBlock = await client.getBlockNumber();
      // Look back ~50k blocks (~1-2 days on Base)
      const fromBlock = currentBlock > 50000n ? currentBlock - 50000n : 0n;

      const logs = await client.getLogs({
        address: USDC_ADDRESSES[network],
        event: transferEvent,
        args: senderAddr ? { from: senderAddr, to: charityAddr } : { to: charityAddr },
        fromBlock,
        toBlock: 'latest',
      });

      // Take the most recent 50 logs
      const recentLogs = logs.slice(-50);

      // Fetch block timestamps in parallel (dedup by block number)
      const blockNumbers = [...new Set(recentLogs.map((l) => l.blockNumber!))];
      const blockMap = new Map<bigint, bigint>();
      await Promise.all(
        blockNumbers.map(async (bn) => {
          const block = await client.getBlock({ blockNumber: bn });
          blockMap.set(bn, block.timestamp);
        }),
      );

      for (const log of recentLogs) {
        const amount = formatUnits(log.args.value ?? 0n, 6);
        const ts = blockMap.get(log.blockNumber!) ?? 0n;
        onChainDonations.push({
          txHash: log.transactionHash ?? '',
          from: (log.args.from as string) ?? '',
          to: (log.args.to as string) ?? '',
          charityId: charity.id,
          charityName: charity.name,
          amount: `$${amount}`,
          currency: 'USDC',
          chain: network,
          timestamp: Number(ts) * 1000,
          status: 'ok',
        });
      }
    } catch (err) {
      console.error('Failed to fetch on-chain donations:', err instanceof Error ? err.message : err);
    }

    // Merge: on-chain + in-memory (dedup by txHash)
    const seenTxHashes = new Set(onChainDonations.map((d) => d.txHash).filter(Boolean));
    const memOnly = donationLog.filter((d) => !d.txHash || !seenTxHashes.has(d.txHash));
    const all = [...onChainDonations, ...memOnly].sort((a, b) => b.timestamp - a.timestamp);

    const okDonations = all.filter((d) => d.status === 'ok');
    const total = okDonations.reduce((sum, d) => sum + parseFloat(d.amount.replace('$', '')), 0);

    res.json({
      total: `$${total.toFixed(4)}`,
      count: okDonations.length,
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
  app.post('/donate', (req, res) => {
    if (!donationClient) {
      res.status(503).json({
        error: 'Donation wallet not configured. Set DONATION_PRIVATE_KEY env var.',
      });
      return;
    }

    const amount = req.body?.amount || '$0.001';

    donationQueue = donationQueue.then(async () => {
      let lastError = '';
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          if (attempt > 0) {
            await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
          }
          const receipt = await donationClient!.donate(amount);
          const log: DonationLog = {
            txHash: receipt.txHash,
            from: receipt.from,
            to: receipt.to,
            charityId: charity.id,
            charityName: charity.name,
            amount: receipt.amount,
            currency: receipt.currency,
            chain: receipt.chain,
            timestamp: receipt.timestamp,
            status: 'ok',
          };
          donationLog.push(log);
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
          return;
        } catch (err) {
          lastError = err instanceof Error ? err.message : 'Unknown error';
          console.error(`Donation attempt ${attempt + 1}/${MAX_RETRIES} failed:`, lastError);
        }
      }
      donationLog.push({
        txHash: '',
        from: account?.address ?? '',
        to: charity.walletAddress,
        charityId: charity.id,
        charityName: charity.name,
        amount,
        currency: 'USDC',
        chain: network,
        timestamp: Date.now(),
        status: 'failed',
        error: lastError,
      });
      res.status(500).json({ error: 'Donation failed', details: lastError });
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
