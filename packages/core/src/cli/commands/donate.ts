import { Command } from 'commander';
import { X402CharityClient } from '../../client.js';
import { findCharity } from '../../registry.js';
import { isSolanaNetwork, type SolanaNetwork } from '../../config.js';
import { getPrivateKey, getNetwork } from '../config.js';

export const donateCommand = new Command('donate')
  .description('Donate USDC to a charity')
  .argument('<cause>', 'Charity ID or name')
  .argument('[amount]', 'Amount in USDC (default: $0.001)')
  .option('-n, --network <network>', 'Network: solana-mainnet or solana-devnet')
  .action(async (cause: string, amount: string | undefined, options: { network?: string }) => {
    amount = amount || '$0.001';
    try {
      const privateKey = getPrivateKey();
      let network: SolanaNetwork;
      if (options.network) {
        if (!isSolanaNetwork(options.network)) {
          console.error(`Invalid network "${options.network}". Use solana-mainnet or solana-devnet.`);
          process.exit(1);
        }
        network = options.network;
      } else {
        network = getNetwork();
      }

      const charity = findCharity(cause);
      if (!charity) {
        console.error(`\nCharity "${cause}" not found. Run "x402charity list" to see available charities.\n`);
        process.exit(1);
      }

      const client = await X402CharityClient.create({
        privateKey,
        network,
        donateEndpoint: charity.x402Endpoint,
        charity,
      });

      console.log(`\nDonating ${amount} USDC to "${charity.name}" on ${network}...\n`);

      const receipt = await client.donate(amount);

      console.log('Donation successful!\n');
      console.log(`  Charity:  ${receipt.charity.name}`);
      console.log(`  Amount:   ${receipt.amount} ${receipt.currency}`);
      if (receipt.txHash) console.log(`  Tx Hash:  ${receipt.txHash}`);
      console.log(`  Chain:    ${receipt.chain}`);
      console.log(`  From:     ${receipt.from}`);
      console.log(`  To:       ${receipt.to}\n`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`\nError: ${message}\n`);
      process.exit(1);
    }
  });
