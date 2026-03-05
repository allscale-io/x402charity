import {
  createWalletClient,
  createPublicClient,
  http,
  parseUnits,
  type Address,
} from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { USDC_ADDRESSES, USDC_DECIMALS, RPC_URLS } from './config.js';
import { findCharity } from './registry.js';
import type { DonationReceipt } from './types.js';

const TRANSFER_ABI = [
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const;

const CHAINS = {
  base,
  'base-sepolia': baseSepolia,
} as const;

export interface ClientOptions {
  privateKey: string;
  network?: 'base' | 'base-sepolia';
}

export class X402CharityClient {
  private privateKey: `0x${string}`;
  private network: 'base' | 'base-sepolia';

  constructor(options: ClientOptions) {
    this.privateKey = (
      options.privateKey.startsWith('0x')
        ? options.privateKey
        : `0x${options.privateKey}`
    ) as `0x${string}`;
    this.network = options.network || 'base-sepolia';
  }

  async donate(causeId: string, amount: string): Promise<DonationReceipt> {
    const charity = findCharity(causeId);
    if (!charity) {
      throw new Error(
        `Charity not found: ${causeId}. Use listCharities() to see available causes.`,
      );
    }

    const chain = CHAINS[this.network];
    const account = privateKeyToAccount(this.privateKey);

    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(RPC_URLS[this.network]),
    });

    const publicClient = createPublicClient({
      chain,
      transport: http(RPC_URLS[this.network]),
    });

    const usdcAddress = USDC_ADDRESSES[this.network];
    const parsedAmount = parseUnits(amount, USDC_DECIMALS);

    const txHash = await walletClient.writeContract({
      address: usdcAddress,
      abi: TRANSFER_ABI,
      functionName: 'transfer',
      args: [charity.walletAddress as Address, parsedAmount],
    });

    await publicClient.waitForTransactionReceipt({ hash: txHash });

    return {
      txHash,
      from: account.address,
      to: charity.walletAddress,
      amount,
      currency: 'USDC',
      chain: this.network,
      charity,
      timestamp: Date.now(),
    };
  }
}
