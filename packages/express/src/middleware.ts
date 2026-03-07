import type { Request, Response, NextFunction } from 'express';
import { X402CharityClient, type ClientOptions } from '@x402charity/core';

export interface X402CharityMiddlewareOptions extends ClientOptions {
  amount?: string;
  silent?: boolean;
  shouldDonate?: (req: Request) => boolean;
}

export function x402charity(options: X402CharityMiddlewareOptions) {
  const {
    amount = '$0.001',
    silent = true,
    shouldDonate,
    ...clientOptions
  } = options;

  const client = new X402CharityClient(clientOptions);

  return (req: Request, _res: Response, next: NextFunction) => {
    if (shouldDonate && !shouldDonate(req)) {
      next();
      return;
    }

    client.donate(amount).catch((err) => {
      if (!silent) {
        console.error('[x402charity] donation failed:', err.message);
      }
    });

    next();
  };
}
