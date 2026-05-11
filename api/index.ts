import type { IncomingMessage, ServerResponse } from 'node:http';
import { createCharityServer } from '../packages/server/dist/server.js';

const appPromise = createCharityServer().then(({ app }) => app);

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await appPromise;
  return (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(req, res);
}
