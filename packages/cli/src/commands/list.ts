import { Command } from 'commander';
import { listCharities } from '@x402charity/core';

export const listCommand = new Command('list')
  .description('List available charities')
  .action(() => {
    const charities = listCharities();

    console.log('\nAvailable charities:\n');

    for (const charity of charities) {
      const badge = charity.verified ? ' [verified]' : '';
      console.log(`  ${charity.id}${badge}`);
      console.log(`    ${charity.name}`);
      console.log(`    ${charity.description}`);
      console.log(`    Wallet: ${charity.walletAddress}`);
      console.log(`    Chain:  ${charity.chain}`);
      if (charity.website) console.log(`    Web:    ${charity.website}`);
      console.log('');
    }
  });
