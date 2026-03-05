import { Command } from 'commander';
import { saveCliConfig, loadCliConfig } from '../config.js';

export const configCommand = new Command('config')
  .description('Configure x402charity CLI');

configCommand
  .command('set-key <privateKey>')
  .description('Set your wallet private key')
  .action((privateKey: string) => {
    const config = loadCliConfig();
    config.privateKey = privateKey;
    saveCliConfig(config);
    console.log('Private key saved to ~/.x402charity/config.json');
  });

configCommand
  .command('set-network <network>')
  .description('Set default network (base or base-sepolia)')
  .action((network: string) => {
    if (network !== 'base' && network !== 'base-sepolia') {
      console.error('Network must be "base" or "base-sepolia"');
      process.exit(1);
    }
    const config = loadCliConfig();
    config.network = network as 'base' | 'base-sepolia';
    saveCliConfig(config);
    console.log(`Default network set to ${network}`);
  });

configCommand
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const config = loadCliConfig();
    console.log('\nCurrent configuration:\n');
    console.log(`  Network:     ${config.network || 'base-sepolia (default)'}`);
    console.log(`  Private Key: ${config.privateKey ? '****' + config.privateKey.slice(-4) : 'not set'}`);
    console.log(`  Config File: ~/.x402charity/config.json\n`);
  });
