import { Command } from 'commander';
import { donateCommand } from './commands/donate.js';
import { listCommand } from './commands/list.js';
import { configCommand } from './commands/config.js';

const program = new Command();

program
  .name('x402charity')
  .description('Donate to charities via x402 stablecoin payments')
  .version('0.1.0');

program.addCommand(donateCommand);
program.addCommand(listCommand);
program.addCommand(configCommand);

program.parse();
