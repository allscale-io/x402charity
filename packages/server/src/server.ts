import { resolve } from 'node:path';
import { timingSafeEqual } from 'node:crypto';
import express, { type Express } from 'express';
import {
  address,
  createSolanaRpc,
  type Address,
  type Signature,
} from '@solana/kit';
import { findAssociatedTokenPda } from '@solana-program/token';
import { paymentMiddlewareFromConfig } from '@x402/express';
import { HTTPFacilitatorClient } from '@x402/core/server';
import {
  SVM_ADDRESS_REGEX,
  SOLANA_DEVNET_CAIP2,
  SOLANA_MAINNET_CAIP2,
  TOKEN_PROGRAM_ADDRESS,
  USDC_DEVNET_ADDRESS,
  USDC_MAINNET_ADDRESS,
  DEVNET_RPC_URL,
  MAINNET_RPC_URL,
} from '@x402/svm';
import { ExactSvmScheme } from '@x402/svm/exact/server';
import {
  X402CharityClient,
  listCharities,
  setCharities,
  isSolanaNetwork,
  EXPLORER_URLS,
  explorerClusterQuery,
  type SolanaNetwork,
  type Charity,
} from 'x402charity';

const USDC_MINTS: Record<SolanaNetwork, string> = {
  'solana-mainnet': USDC_MAINNET_ADDRESS,
  'solana-devnet': USDC_DEVNET_ADDRESS,
};

const CAIP2: Record<SolanaNetwork, string> = {
  'solana-mainnet': SOLANA_MAINNET_CAIP2,
  'solana-devnet': SOLANA_DEVNET_CAIP2,
};

const RPC_URLS: Record<SolanaNetwork, string> = {
  'solana-mainnet': MAINNET_RPC_URL,
  'solana-devnet': DEVNET_RPC_URL,
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
  /** Donor wallet secret key — base58 64-byte or JSON-array format. */
  privateKey?: string;
  /** Network. Default: solana-devnet */
  network?: SolanaNetwork;
  /** Path to the docs directory for serving static pages. */
  docsDir?: string;
  /** Charity wallet (base58 Solana address). */
  charityWallet?: string;
  /** Charity name. */
  charityName?: string;
}

/**
 * Resolve the single charity from env vars or registry.
 */
function resolveCharity(options: ServerOptions, network: SolanaNetwork): Charity {
  const charityWallet = options.charityWallet || process.env.CHARITY_WALLET;
  const charityName = options.charityName || process.env.CHARITY_NAME || 'My Charity';
  const baseUrl = process.env.BASE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3402');

  if (charityWallet) {
    if (!SVM_ADDRESS_REGEX.test(charityWallet)) {
      throw new Error(`Invalid CHARITY_WALLET address: "${charityWallet}". Must be a base58-encoded Solana public key.`);
    }
    const charity: Charity = {
      id: charityName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: charityName,
      description: process.env.CHARITY_DESCRIPTION || `Donations to ${charityName}`,
      walletAddress: charityWallet,
      chain: network,
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
 * Derive the USDC associated token account for a wallet on the given network.
 */
async function getUsdcAta(
  wallet: string,
  network: SolanaNetwork,
): Promise<Address> {
  const [ata] = await findAssociatedTokenPda({
    owner: address(wallet),
    tokenProgram: address(TOKEN_PROGRAM_ADDRESS),
    mint: address(USDC_MINTS[network]),
  });
  return ata;
}

/**
 * Create the Express app that donates on behalf of users using the server's own wallet.
 */
export async function createCharityServer(options: ServerOptions = {}): Promise<{
  app: Express;
}> {
  const privateKey = options.privateKey || process.env.DONATION_PRIVATE_KEY || '';
  const rawNetwork = options.network || process.env.DONATION_NETWORK || 'solana-devnet';
  if (!isSolanaNetwork(rawNetwork)) {
    throw new Error(`Invalid DONATION_NETWORK "${rawNetwork}". Must be "solana-mainnet" or "solana-devnet".`);
  }
  const network: SolanaNetwork = rawNetwork;

  const charity = resolveCharity(options, network);

  const explorerUrl = EXPLORER_URLS[network];
  const explorerSuffix = explorerClusterQuery(network);

  // Set up wallet for server-side x402 client (trigger-donate endpoint)
  let donorAddress: string | null = null;
  let donationClient: X402CharityClient | null = null;
  if (privateKey) {
    try {
      donationClient = await X402CharityClient.create({
        privateKey,
        network,
        donateEndpoint: charity.x402Endpoint,
        charity,
      });
      donorAddress = donationClient.account.address;
      console.log('\n=== Donation Wallet ===');
      console.log(`  Address: ${donorAddress}`);
      console.log(`  Network: ${network}`);
      console.log(`  Fund this address with USDC on ${network}. SOL is not required — the facilitator pays gas.`);
      console.log(`  Explorer: ${explorerUrl}/account/${donorAddress}${explorerSuffix}\n`);
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
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Payment, Payment-Signature');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  // --- Static pages ---
  // On Vercel, static files are served by the platform before Express sees the request.
  // For local/Docker, serve the docs/ directory directly (CSS, JS, assets, fonts).
  const docsDir = options.docsDir || resolve(process.cwd(), 'docs');

  app.get('/', (_req, res) => res.sendFile(resolve(docsDir, 'index.html')));
  app.use(express.static(docsDir, { index: false }));

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

  // Facilitator override — useful when the default x402.org facilitator doesn't
  // yet support your target network (e.g. solana-mainnet). PayAI and Coinbase
  // CDP also operate x402-compatible facilitators.
  const facilitatorUrl = process.env.FACILITATOR_URL?.trim();
  const facilitatorClient = facilitatorUrl
    ? new HTTPFacilitatorClient({ url: facilitatorUrl })
    : undefined;
  if (facilitatorUrl) {
    console.log(`=== Facilitator ===\n  ${facilitatorUrl}\n`);
  }

  app.use(
    paymentMiddlewareFromConfig(
      routes as Parameters<typeof paymentMiddlewareFromConfig>[0],
      facilitatorClient,
      [{ network: caip2 as `${string}:${string}`, server: new ExactSvmScheme() }],
    ),
  );

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      charity: { name: charity.name, wallet: charity.walletAddress },
      walletConfigured: !!donorAddress,
      donationWallet: donorAddress,
    });
  });

  // Public address and balances of the donation wallet
  app.get('/address', async (_req, res) => {
    if (!donorAddress) {
      res.status(503).json({ error: 'Donation wallet not configured.' });
      return;
    }

    const networks: SolanaNetwork[] = ['solana-mainnet', 'solana-devnet'];
    const balances: Record<string, { sol: string; usdc: string }> = {};

    await Promise.all(
      networks.map(async (net) => {
        try {
          const rpc = createSolanaRpc(RPC_URLS[net]);
          const ata = await getUsdcAta(donorAddress!, net);
          const [solRes, usdcRes] = await Promise.all([
            rpc.getBalance(address(donorAddress!)).send().catch(() => null),
            rpc.getTokenAccountBalance(ata).send().catch(() => null),
          ]);
          balances[net] = {
            sol: solRes ? (Number(solRes.value) / 1e9).toFixed(9) : '0',
            usdc: usdcRes?.value?.uiAmountString ?? '0',
          };
        } catch {
          balances[net] = { sol: '0', usdc: '0' };
        }
      }),
    );

    res.json({ address: donorAddress, balances });
  });

  // Charity info with balances
  app.get('/charity', async (_req, res) => {
    const networks: SolanaNetwork[] = ['solana-mainnet', 'solana-devnet'];
    const balances: Record<string, { sol: string; usdc: string }> = {};

    await Promise.all(
      networks.map(async (net) => {
        try {
          const rpc = createSolanaRpc(RPC_URLS[net]);
          const ata = await getUsdcAta(charity.walletAddress, net);
          const [solRes, usdcRes] = await Promise.all([
            rpc.getBalance(address(charity.walletAddress)).send().catch(() => null),
            rpc.getTokenAccountBalance(ata).send().catch(() => null),
          ]);
          balances[net] = {
            sol: solRes ? (Number(solRes.value) / 1e9).toFixed(9) : '0',
            usdc: usdcRes?.value?.uiAmountString ?? '0',
          };
        } catch {
          balances[net] = { sol: '0', usdc: '0' };
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

  // Donation history — scans recent USDC transfers into the charity's ATA on
  // each network. Uses getSignaturesForAddress + getTransaction per signature.
  // Accepts ?limit=N (default 50, max 200) to bound the scan per network.
  app.get('/donations', async (req, res) => {
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string) || 50));
    const networks: SolanaNetwork[] = ['solana-mainnet', 'solana-devnet'];
    const onChainDonations: DonationLog[] = [];

    await Promise.all(networks.map(async (net) => {
      try {
        const rpc = createSolanaRpc(RPC_URLS[net]);
        const charityWallet = charity.walletAddress;
        const ata = await getUsdcAta(charityWallet, net);
        const usdcMint = USDC_MINTS[net];

        const sigs = await rpc.getSignaturesForAddress(ata, { limit }).send();
        if (!sigs.length) return;

        // Fetch transactions in small batches (RPC rate limit friendly)
        const BATCH = 5;
        for (let i = 0; i < sigs.length; i += BATCH) {
          const slice = sigs.slice(i, i + BATCH);
          const txs = await Promise.all(
            slice.map((s) =>
              rpc
                .getTransaction(s.signature, {
                  encoding: 'jsonParsed',
                  commitment: 'confirmed',
                  maxSupportedTransactionVersion: 0,
                })
                .send()
                .catch(() => null),
            ),
          );

          for (let j = 0; j < txs.length; j++) {
            const tx = txs[j];
            const sigInfo = slice[j];
            if (!tx || !tx.meta || tx.meta.err) continue;
            const post = tx.meta.postTokenBalances ?? [];
            const pre = tx.meta.preTokenBalances ?? [];

            // Find the charity USDC balance entry (by owner + mint) in post
            const postEntry = post.find(
              (b) => b.mint === usdcMint && b.owner === charityWallet,
            );
            if (!postEntry) continue;
            const preEntry = pre.find(
              (b) => b.accountIndex === postEntry.accountIndex,
            );

            const postAmt = Number(postEntry.uiTokenAmount?.uiAmountString ?? '0');
            const preAmt = Number(preEntry?.uiTokenAmount?.uiAmountString ?? '0');
            const delta = postAmt - preAmt;
            if (delta <= 0) continue;

            // Sender: find a different-owner balance entry that decreased
            let fromAddr = '';
            for (const p of pre) {
              if (p.mint !== usdcMint || p.owner === charityWallet) continue;
              const matched = post.find((b) => b.accountIndex === p.accountIndex);
              const preX = Number(p.uiTokenAmount?.uiAmountString ?? '0');
              const postX = Number(matched?.uiTokenAmount?.uiAmountString ?? '0');
              if (preX - postX > 0) {
                fromAddr = p.owner ?? '';
                break;
              }
            }

            onChainDonations.push({
              txHash: String(sigInfo.signature),
              from: fromAddr,
              to: charityWallet,
              charityId: charity.id,
              charityName: charity.name,
              amount: `$${delta.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')}`,
              currency: 'USDC',
              chain: net,
              timestamp: sigInfo.blockTime
                ? Number(sigInfo.blockTime) * 1000
                : Date.now(),
              status: 'ok',
            });
          }
        }
      } catch (err) {
        console.error(`Failed to fetch donations (${net}):`, err instanceof Error ? err.message : err);
      }
    }));

    const all = onChainDonations.sort((a, b) => b.timestamp - a.timestamp);
    const total = all.reduce((sum, d) => sum + parseFloat(d.amount.replace('$', '')), 0);

    res.json({
      total: `$${total.toFixed(6)}`,
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

  // Donation queue — serializes x402 payments to avoid blockhash/nonce conflicts
  let donationQueue: Promise<void> = Promise.resolve();
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 1000;

  // Trigger endpoint — server pays from its own wallet via x402 protocol
  app.post('/donate', async (req, res) => {
    // API key auth — if DONATE_API_KEY is set, require Authorization: Bearer <key>
    if (donateApiKey) {
      const authHeader = req.headers.authorization || '';
      if (!authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized. Provide a valid Authorization: Bearer <DONATE_API_KEY> header.' });
        return;
      }
      const provided = authHeader.slice(7);
      // Constant-time comparison to prevent timing attacks
      const a = Buffer.from(provided);
      const b = Buffer.from(donateApiKey);
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
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
export async function startCharityServer(options: ServerOptions = {}): Promise<void> {
  const port = options.port || 3402;
  const { app } = await createCharityServer(options);

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

// Re-export the Signature type so consumers can type-check signature strings.
export type SolanaSignature = Signature;
