import { Command } from 'commander';
import { X402CharityClient } from '@x402charity/core';
import { getPrivateKey, getNetwork } from '../config.js';

export const donateCommand = new Command('donate')
  .description('Donate USDC to a charity')
  .argument('<cause>', 'Charity ID or name')
  .argument('<amount>', 'Amount in USDC')
  .option('-n, --network <network>', 'Network: base or base-sepolia')
  .action(async (cause: string, amount: string, options: { network?: string }) => {
    try {
      const privateKey = getPrivateKey();
      const network = (options.network || getNetwork()) as 'base' | 'base-sepolia';

      const client = new X402CharityClient({ privateKey, network });

      console.log(`\nDonating ${amount} USDC to "${cause}" on ${network}...\n`);

      const receipt = await client.donate(cause, amount);

      console.log('Donation successful!\n');
      console.log(`  Charity:  ${receipt.charity.name}`);
      console.log(`  Amount:   ${receipt.amount} ${receipt.currency}`);
      console.log(`  Tx Hash:  ${receipt.txHash}`);
      console.log(`  Chain:    ${receipt.chain}`);
      console.log(`  From:     ${receipt.from}`);
      console.log(`  To:       ${receipt.to}\n`);
    } catch (error: any) {
      console.error(`\nError: ${error.message}\n`);
      process.exit(1);
    }
  });
