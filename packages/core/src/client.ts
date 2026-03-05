import {
  createWalletClient,
  createPublicClient,
  http,
  parseUnits,
  formatUnits,
  type Address,
  type Chain,
  type PublicClient,
  type WalletClient,
  type HttpTransport,
} from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';
import { USDC_ADDRESSES, USDC_DECIMALS, RPC_URLS } from './config.js';
import { findCharity } from './registry.js';
import type { DonationReceipt } from './types.js';

const ERC20_ABI = [
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
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
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
  private account: PrivateKeyAccount;
  private walletClient: WalletClient<HttpTransport, Chain, PrivateKeyAccount>;
  private publicClient: PublicClient<HttpTransport, Chain>;

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
    const recipient = charity.walletAddress as Address;

    // Check USDC balance before attempting transfer
    const balance = await this.publicClient.readContract({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [this.account.address],
    });

    if (balance < parsedAmount) {
      throw new Error(
        `Insufficient USDC balance: have ${formatUnits(balance, USDC_DECIMALS)}, need ${amount}`,
      );
    }

    // Simulate first to catch reverts before sending a real transaction
    const { request } = await this.publicClient.simulateContract({
      account: this.account,
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [recipient, parsedAmount],
    });

    const txHash = await this.walletClient.writeContract(request);

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });

    if (receipt.status === 'reverted') {
      throw new Error(`Transaction reverted: ${txHash}`);
    }

    return {
      txHash,
      from: this.account.address,
      to: charity.walletAddress,
      amount,
      currency: 'USDC',
      chain: this.network,
      charity,
      timestamp: Date.now(),
      blockNumber: Number(receipt.blockNumber),
      gasUsed: receipt.gasUsed.toString(),
    };
  }
}
