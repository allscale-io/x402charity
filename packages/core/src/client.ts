import bs58 from 'bs58';
import {
  createKeyPairSignerFromBytes,
  type KeyPairSigner,
} from '@solana/kit';
import { x402Client } from '@x402/core/client';
import { ExactSvmScheme, SVM_ADDRESS_REGEX } from '@x402/svm';
import {
  wrapFetchWithPayment,
  decodePaymentResponseHeader,
} from '@x402/fetch';
import { RPC_URLS, CAIP2_CHAIN_IDS, type SolanaNetwork } from './config.js';
import type { Charity, DonationReceipt } from './types.js';

export interface ClientOptions {
  /**
   * Solana donor private key. Accepts either:
   *   - JSON array of 64 numbers (Solana CLI convention, e.g. "[12,34,...]")
   *   - Base58-encoded 64-byte secret key (Phantom export format)
   */
  privateKey: string;
  network?: SolanaNetwork;
  /** The x402-gated donation endpoint URL. */
  donateEndpoint: string;
  /** The charity receiving donations. */
  charity: Charity;
}

/**
 * Parse a Solana secret key from one of the two common formats and return
 * the raw 64-byte secret key.
 */
export function parseSolanaSecretKey(input: string): Uint8Array {
  const trimmed = input.trim();
  if (trimmed.startsWith('[')) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new Error('Invalid Solana private key: malformed JSON array.');
    }
    if (
      !Array.isArray(parsed)
      || parsed.length !== 64
      || !parsed.every((n) => typeof n === 'number' && n >= 0 && n <= 255)
    ) {
      throw new Error('Invalid Solana private key: JSON array must contain exactly 64 byte-values (0-255).');
    }
    return Uint8Array.from(parsed as number[]);
  }
  let decoded: Uint8Array;
  try {
    decoded = bs58.decode(trimmed);
  } catch {
    throw new Error('Invalid Solana private key. Expected a base58 64-byte secret key or a JSON array of 64 numbers.');
  }
  if (decoded.length !== 64) {
    throw new Error(`Invalid Solana private key: decoded length is ${decoded.length} bytes (expected 64).`);
  }
  return decoded;
}

export class X402CharityClient {
  readonly network: SolanaNetwork;
  readonly signer: KeyPairSigner;
  readonly account: { address: string };
  private readonly paymentFetch: typeof globalThis.fetch;
  private readonly donateEndpoint: string;
  private readonly charity: Charity;

  private constructor(
    network: SolanaNetwork,
    signer: KeyPairSigner,
    paymentFetch: typeof globalThis.fetch,
    donateEndpoint: string,
    charity: Charity,
  ) {
    this.network = network;
    this.signer = signer;
    this.account = { address: String(signer.address) };
    this.paymentFetch = paymentFetch;
    this.donateEndpoint = donateEndpoint;
    this.charity = charity;
  }

  static async create(options: ClientOptions): Promise<X402CharityClient> {
    if (!SVM_ADDRESS_REGEX.test(options.charity.walletAddress)) {
      throw new Error(
        `Charity walletAddress "${options.charity.walletAddress}" is not a valid Solana base58 address.`,
      );
    }
    const secret = parseSolanaSecretKey(options.privateKey);
    const signer = await createKeyPairSignerFromBytes(secret);
    const network = options.network || 'solana-devnet';
    const caip2 = CAIP2_CHAIN_IDS[network] as `${string}:${string}`;
    const rpcUrl = RPC_URLS[network];
    const x402c = new x402Client().register(
      caip2,
      new ExactSvmScheme(signer, { rpcUrl }),
    );
    const paymentFetch = wrapFetchWithPayment(globalThis.fetch, x402c);
    return new X402CharityClient(network, signer, paymentFetch, options.donateEndpoint, options.charity);
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

    let txHash = '';
    const paymentResponseHeader = response.headers.get('PAYMENT-RESPONSE')
      || response.headers.get('X-PAYMENT-RESPONSE');
    if (paymentResponseHeader) {
      try {
        const settled = decodePaymentResponseHeader(paymentResponseHeader) as { transaction?: string };
        txHash = settled.transaction || '';
      } catch {
        // Header decode failed — fall through
      }
    }

    let responseData: Record<string, string> = {};
    try {
      responseData = await response.json() as Record<string, string>;
    } catch {
      // Endpoint may not return JSON
    }

    return {
      txHash: txHash || responseData.txHash || responseData.transaction || '',
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
