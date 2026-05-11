import { Command } from 'commander';
import { saveCliConfig, loadCliConfig } from '../config.js';
import { isSolanaNetwork } from '../../config.js';

export const configCommand = new Command('config')
  .description('Configure x402charity CLI');

configCommand
  .command('set-key <privateKey>')
  .description('Set your Solana wallet secret key (base58 64-byte or JSON-array format)')
  .action((privateKey: string) => {
    const config = loadCliConfig();
    config.privateKey = privateKey;
    saveCliConfig(config);
    console.log('Private key saved to ~/.x402charity/config.json');
  });

configCommand
  .command('set-network <network>')
  .description('Set default network (solana-mainnet or solana-devnet)')
  .action((network: string) => {
    if (!isSolanaNetwork(network)) {
      console.error('Network must be "solana-mainnet" or "solana-devnet"');
      process.exit(1);
    }
    const config = loadCliConfig();
    config.network = network;
    saveCliConfig(config);
    console.log(`Default network set to ${network}`);
  });

configCommand
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const config = loadCliConfig();
    console.log('\nCurrent configuration:\n');
    console.log(`  Network:     ${config.network || 'solana-devnet (default)'}`);
    console.log(`  Private Key: ${config.privateKey ? '****' + config.privateKey.slice(-4) : 'not set'}`);
    console.log(`  Config File: ~/.x402charity/config.json\n`);
  });
