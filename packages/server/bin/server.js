#!/usr/bin/env node
import { startCharityServer } from '../dist/server.js';

const port = parseInt(process.env.PORT || '3402', 10);
const facilitatorUrl = process.env.FACILITATOR_URL || undefined;

startCharityServer({ port, facilitatorUrl });
