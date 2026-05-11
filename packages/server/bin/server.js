#!/usr/bin/env node
import { startCharityServer } from '../dist/server.js';

const port = parseInt(process.env.PORT || '3402', 10);

startCharityServer({ port }).catch((err) => {
  console.error('Failed to start charity server:', err);
  process.exit(1);
});
