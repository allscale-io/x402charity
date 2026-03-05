import type { Charity } from './types.js';

const DEFAULT_CHARITIES: Charity[] = [
  {
    id: 'testing-charity',
    name: 'Testing Charity',
    description: 'Test charity for development and demos',
    walletAddress: '0x8DC1521132381aAB648e067c2Db3677D5BF70c6d',
    chain: 'base-sepolia',
    verified: false,
    category: 'testing',
  },
];

let customCharities: Charity[] | null = null;

export function setCharities(charities: Charity[]): void {
  customCharities = charities;
}

export function listCharities(): Charity[] {
  return customCharities || DEFAULT_CHARITIES;
}

export function findCharity(idOrName: string): Charity | undefined {
  const all = listCharities();
  const query = idOrName.toLowerCase();
  return all.find(
    (c) => c.id === query || c.name.toLowerCase().includes(query),
  );
}
