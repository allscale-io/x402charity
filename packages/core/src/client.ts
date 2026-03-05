import {
  createWalletClient,
  createPublicClient,
  http,
  parseUnits,
  type Address,
  type Chain,
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

const CHAINS: Record<string, Chain> = {
  base,
  'base-sepolia': baseSepolia,
};

export interface ClientOptions {
  privateKey: string;
  network?: 'base' | 'base-sepolia';
}

export class X402CharityClient {
  private network: 'base' | 'base-sepolia';
  private chain: Chain;
  private account;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private walletClient: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private publicClient: any;

  constructor(options: ClientOptions) {
    const privateKey = (
      options.privateKey.startsWith('0x')
        ? options.privateKey
        : `0x${options.privateKey}`
    ) as `0x${string}`;
    this.network = options.network || 'base-sepolia';
    this.chain = CHAINS[this.network];

    const transport = http(RPC_URLS[this.network]);

    this.account = privateKeyToAccount(privateKey);
    this.walletClient = createWalletClient({
      account: this.account,
      chain: this.chain,
      transport,
    });
    this.publicClient = createPublicClient({ chain: this.chain, transport });
  }

  async donate(causeId: string, amount: string): Promise<DonationReceipt> {
    const charity = findCharity(causeId);
    if (!charity) {
      throw new Error(
        `Charity not found: ${causeId}. Use listCharities() to see available causes.`,
      );
    }

    const usdcAddress = USDC_ADDRESSES[this.network];
    const parsedAmount = parseUnits(amount, USDC_DECIMALS);

    const txHash = await this.walletClient.writeContract({
      address: usdcAddress,
      abi: TRANSFER_ABI,
      functionName: 'transfer',
      args: [charity.walletAddress as Address, parsedAmount],
      chain: this.chain,
    });

    await this.publicClient.waitForTransactionReceipt({ hash: txHash });

    return {
      txHash,
      from: this.account.address,
      to: charity.walletAddress,
      amount,
      currency: 'USDC',
      chain: this.network,
      charity,
      timestamp: Date.now(),
    };
  }
}
