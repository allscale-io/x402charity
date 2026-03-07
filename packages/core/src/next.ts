import { NextRequest, NextResponse } from 'next/server.js';
import { X402CharityClient, type ClientOptions } from './client.js';

export interface X402CharityMiddlewareOptions extends ClientOptions {
  amount?: string;
  silent?: boolean;
  matcher?: string | string[];
}

export function x402charity(options: X402CharityMiddlewareOptions) {
  const {
    amount = '$0.001',
    silent = true,
    matcher,
    ...clientOptions
  } = options;

  const patterns = matcher
    ? (Array.isArray(matcher) ? matcher : [matcher])
    : null;

  const client = new X402CharityClient(clientOptions);

  return (request: NextRequest) => {
    if (patterns) {
      const pathname = request.nextUrl.pathname;
      const matched = patterns.some((p) => {
        if (p.endsWith('*')) {
          return pathname.startsWith(p.slice(0, -1));
        }
        return pathname === p;
      });
      if (!matched) {
        return NextResponse.next();
      }
    }

    client.donate(amount).catch((err) => {
      if (!silent) {
        console.error('[x402charity] donation failed:', err.message);
      }
    });

    return NextResponse.next();
  };
}
