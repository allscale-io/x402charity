import type { Charity } from './types.js';

const DEFAULT_CHARITIES: Charity[] = [
  {
    id: 'red-cross',
    name: 'American Red Cross',
    description: 'Disaster relief, blood donations, and emergency assistance',
    walletAddress: '0x1111111111111111111111111111111111111111',
    chain: 'base-sepolia',
    verified: false,
    website: 'https://www.redcross.org',
    category: 'humanitarian',
  },
  {
    id: 'unicef',
    name: 'UNICEF',
    description: "Children's rights, education, and emergency relief worldwide",
    walletAddress: '0x2222222222222222222222222222222222222222',
    chain: 'base-sepolia',
    verified: false,
    website: 'https://www.unicef.org',
    category: 'humanitarian',
  },
  {
    id: 'doctors-without-borders',
    name: 'Doctors Without Borders (MSF)',
    description: 'Medical humanitarian assistance in conflict zones and emergencies',
    walletAddress: '0x3333333333333333333333333333333333333333',
    chain: 'base-sepolia',
    verified: false,
    website: 'https://www.msf.org',
    category: 'healthcare',
  },
  {
    id: 'water-org',
    name: 'Water.org',
    description: 'Safe water and sanitation access for communities in need',
    walletAddress: '0x4444444444444444444444444444444444444444',
    chain: 'base-sepolia',
    verified: false,
    website: 'https://water.org',
    category: 'environment',
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
