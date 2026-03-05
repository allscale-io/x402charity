import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const CONFIG_DIR = join(homedir(), '.x402charity');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

interface CliConfig {
  privateKey?: string;
  network?: 'base' | 'base-sepolia';
}

export function loadCliConfig(): CliConfig {
  if (!existsSync(CONFIG_FILE)) return {};
  return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
}

export function saveCliConfig(config: CliConfig): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
}

export function getPrivateKey(): string {
  const envKey = process.env.X402_PRIVATE_KEY;
  if (envKey) return envKey;

  const config = loadCliConfig();
  if (config.privateKey) return config.privateKey;

  console.error(
    'No private key found. Set X402_PRIVATE_KEY env var or run:\n  x402charity config set-key <key>',
  );
  return process.exit(1) as never;
}

export function getNetwork(): 'base' | 'base-sepolia' {
  const envNetwork = process.env.X402_NETWORK;
  if (envNetwork === 'base' || envNetwork === 'base-sepolia') return envNetwork;

  const config = loadCliConfig();
  return config.network || 'base-sepolia';
}
