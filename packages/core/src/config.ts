import {
  SOLANA_DEVNET_CAIP2,
  SOLANA_MAINNET_CAIP2,
  DEVNET_RPC_URL,
  MAINNET_RPC_URL,
} from '@x402/svm';

export type SolanaNetwork = 'solana-mainnet' | 'solana-devnet';

export const NETWORKS: SolanaNetwork[] = ['solana-mainnet', 'solana-devnet'];

export const RPC_URLS: Record<SolanaNetwork, string> = {
  'solana-mainnet': MAINNET_RPC_URL,
  'solana-devnet': DEVNET_RPC_URL,
};

export const CAIP2_CHAIN_IDS: Record<SolanaNetwork, string> = {
  'solana-mainnet': SOLANA_MAINNET_CAIP2,
  'solana-devnet': SOLANA_DEVNET_CAIP2,
};

export const EXPLORER_URLS: Record<SolanaNetwork, string> = {
  'solana-mainnet': 'https://solscan.io',
  'solana-devnet': 'https://solscan.io',
};

/**
 * Solscan adds ?cluster=devnet for non-mainnet. This returns the query suffix
 * to append to an explorer URL.
 */
export function explorerClusterQuery(network: SolanaNetwork): string {
  return network === 'solana-devnet' ? '?cluster=devnet' : '';
}

export function isSolanaNetwork(value: string): value is SolanaNetwork {
  return value === 'solana-mainnet' || value === 'solana-devnet';
}
