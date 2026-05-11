import type { SolanaNetwork } from './config.js';

export interface Charity {
  id: string;
  name: string;
  description: string;
  /** Base58-encoded Solana wallet address (32 bytes / 32-44 chars). */
  walletAddress: string;
  chain: SolanaNetwork;
  verified: boolean;
  website?: string;
  category?: string;
  /** x402-gated donation endpoint URL. */
  x402Endpoint: string;
}

export interface DonationReceipt {
  /** Base58-encoded Solana transaction signature. */
  txHash: string;
  from: string;
  to: string;
  amount: string;
  currency: string;
  chain: string;
  charity: Charity;
  timestamp: number;
}
