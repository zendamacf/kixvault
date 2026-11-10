import type { AppType } from '@kixvault/api/app';
import { hc } from 'hono/client';
import { getActiveLocale } from '@/i18n';

export const api = hc<AppType>('/', {
  fetch: (input: RequestInfo | URL, init?: RequestInit) =>
    fetch(input, {
      ...init,
      credentials: 'include',
      // The browser would send its own language here. Send the app's, so emails match the UI.
      headers: {
        ...Object.fromEntries(new Headers(init?.headers)),
        'Accept-Language': getActiveLocale(),
      },
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

/** API failure that keeps the machine-readable `code` next to the message. */
export class ApiError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

export async function toApiError(response: { json(): Promise<unknown> }, fallback: string) {
  try {
    const data = (await response.json()) as { error?: string; code?: string };
    return new ApiError(data.error ?? fallback, data.code);
  } catch {
    return new ApiError(fallback);
  }
}
