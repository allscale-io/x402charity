export interface Charity {
  id: string;
  name: string;
  description: string;
  walletAddress: string;
  chain: 'base' | 'base-sepolia';
  verified: boolean;
  website?: string;
  category?: string;
  /** x402-gated donation endpoint URL. */
  x402Endpoint: string;
}

export interface DonationReceipt {
  txHash: string;
  from: string;
  to: string;
  amount: string;
  currency: string;
  chain: string;
  charity: Charity;
  timestamp: number;
}
