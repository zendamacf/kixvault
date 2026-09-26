import type { AppType } from '@kixvault/api/app';
import { hc } from 'hono/client';

export const api = hc<AppType>('/', {
  fetch: (input: RequestInfo | URL, init?: RequestInit) =>
    fetch(input, {
      ...init,
      credentials: 'include',
    }),
});

// We only need to parse an error, don't need any other attributes from a response
export async function parseApiError(response: { json(): Promise<unknown> }, fallback: string) {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? fallback;
  } catch {
    return fallback;
  }
}
