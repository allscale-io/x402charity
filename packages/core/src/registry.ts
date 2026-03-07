import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Charity } from './types.js';

const FALLBACK_CHARITIES: Charity[] = [
  {
    id: 'testing-charity',
    name: 'Testing Charity',
    description: 'Test charity for development and demos',
    walletAddress: '0x8DC1521132381aAB648e067c2Db3677D5BF70c6d',
    chain: 'base-sepolia',
    verified: false,
    category: 'testing',
    x402Endpoint: 'https://x402charity.com/donate',
  },
];

function loadCharitiesFromFile(): Charity[] | null {
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const filePath = resolve(__dirname, '../../../registry/charities.json');
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    if (Array.isArray(data.charities) && data.charities.length > 0) {
      return data.charities;
    }
  } catch {
    // File not found (e.g. installed as npm package outside the monorepo)
  }
  return null;
}

const registryCharities = loadCharitiesFromFile();

let customCharities: Charity[] | null = null;

export function setCharities(charities: Charity[]): void {
  customCharities = charities;
}

export function listCharities(): Charity[] {
  return customCharities || registryCharities || FALLBACK_CHARITIES;
}

export function findCharity(idOrName: string): Charity | undefined {
  const all = listCharities();
  const query = idOrName.toLowerCase();
  return all.find(
    (c) => c.id === query || c.name.toLowerCase().includes(query),
  );
}
