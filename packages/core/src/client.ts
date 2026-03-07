import {
  createWalletClient,
  http,
  publicActions,
  type Chain,
} from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';
import { x402Client } from '@x402/core/client';
import { ExactEvmScheme, toClientEvmSigner } from '@x402/evm';
import { wrapFetchWithPayment } from '@x402/fetch';
import { RPC_URLS, CAIP2_CHAIN_IDS } from './config.js';
import type { Charity, DonationReceipt } from './types.js';

const CHAINS: Record<string, Chain> = {
  base,
  'base-sepolia': baseSepolia,
};

export interface ClientOptions {
  privateKey: string;
  network?: 'base' | 'base-sepolia';
  /** The x402-gated donation endpoint URL. */
  donateEndpoint: string;
  /** The charity receiving donations. */
  charity: Charity;
}

export class X402CharityClient {
  private network: 'base' | 'base-sepolia';
  readonly account: PrivateKeyAccount;
  private paymentFetch: typeof globalThis.fetch;
  private donateEndpoint: string;
  private charity: Charity;

  constructor(options: ClientOptions) {
    const privateKey = (
      options.privateKey.startsWith('0x')
        ? options.privateKey
        : `0x${options.privateKey}`
    ) as `0x${string}`;
    if (!/^0x[a-fA-F0-9]{64}$/.test(privateKey)) {
      throw new Error('Invalid private key format. Must be a 64-character hex string (with or without 0x prefix).');
    }
    this.network = options.network || 'base-sepolia';
    this.donateEndpoint = options.donateEndpoint;
    this.charity = options.charity;
    const chain = CHAINS[this.network];
    const transport = http(RPC_URLS[this.network]);

    this.account = privateKeyToAccount(privateKey);

    const viemClient = createWalletClient({
      account: this.account,
      chain,
      transport,
    }).extend(publicActions);

    const evmSigner = toClientEvmSigner({
      address: this.account.address,
      signTypedData: (msg) => viemClient.signTypedData(msg as Parameters<typeof viemClient.signTypedData>[0]),
      readContract: (args) => viemClient.readContract(args as Parameters<typeof viemClient.readContract>[0]),
    });

    const caip2 = CAIP2_CHAIN_IDS[this.network] as `${string}:${string}`;
    const client = new x402Client().register(caip2, new ExactEvmScheme(evmSigner));
    this.paymentFetch = wrapFetchWithPayment(globalThis.fetch, client);
  }

  async donate(amount: string = '$0.001'): Promise<DonationReceipt> {
    const url = new URL(this.donateEndpoint);
    url.searchParams.set('amount', amount);

    const response = await this.paymentFetch(url.toString());

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(
        `x402 donation failed (${response.status}): ${body || response.statusText}`,
      );
    }

    let responseData: Record<string, string> = {};
    try {
      responseData = await response.json() as Record<string, string>;
    } catch {
      // Endpoint may not return JSON
    }

    return {
      txHash: responseData.txHash || responseData.transaction || '',
      from: this.account.address,
      to: this.charity.walletAddress,
      amount,
      currency: 'USDC',
      chain: this.network,
      charity: this.charity,
      timestamp: Date.now(),
    };
  }
}
