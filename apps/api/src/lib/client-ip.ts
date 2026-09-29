import { getConnInfo } from 'hono/bun';
import type { Context } from 'hono';
import type { ApiEnv } from '../types';

export function getRequestClientIp(c: Context<ApiEnv>): string {
  const forwardedFor = c.req.header('x-forwarded-for');

  if (forwardedFor) {
    const [first] = forwardedFor.split(',');

    if (first?.trim()) {
      return first.trim();
    }
  }

  try {
    const remoteAddress = getConnInfo(c).remote.address;

    if (remoteAddress) {
      return remoteAddress;
    }
  } catch {
    // Hono's in-memory test client does not provide Bun server metadata.
  }

  return 'unknown';
}
