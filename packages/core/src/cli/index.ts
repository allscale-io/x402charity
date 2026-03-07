import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { donateCommand } from './commands/donate.js';
import { listCommand } from './commands/list.js';
import { configCommand } from './commands/config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf-8'));

const program = new Command();

program
  .name('x402charity')
  .description('Donate to charities via x402 stablecoin payments')
  .version(pkg.version);

program.addCommand(donateCommand);
program.addCommand(listCommand);
program.addCommand(configCommand);

program.parse();
