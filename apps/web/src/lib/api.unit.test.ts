import { afterEach, describe, expect, mock, test } from 'bun:test';
import { ApiError, api, parseApiError, toApiError } from './api';

describe('parseApiError', () => {
  test('returns the API error message when present', async () => {
    const response = new Response(JSON.stringify({ error: 'Email already in use' }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' },
    });

    await expect(parseApiError(response, 'Request failed')).resolves.toBe('Email already in use');
  });

  test('falls back when the response body is not JSON', async () => {
    const response = new Response('not json', { status: 500 });

    await expect(parseApiError(response, 'Request failed')).resolves.toBe('Request failed');
  });
});

describe('toApiError', () => {
  test('keeps the error code next to the message', async () => {
    const response = new Response(
      JSON.stringify({
        error: 'Confirm your email address to sign in',
        code: 'email_not_verified',
      }),
      { status: 403 },
    );

    const error = await toApiError(response, 'Failed to log in');

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('Confirm your email address to sign in');
    expect(error.code).toBe('email_not_verified');
  });

  test('falls back when the body is not JSON', async () => {
    const error = await toApiError(new Response('oops', { status: 500 }), 'Failed to log in');

    expect(error.message).toBe('Failed to log in');
    expect(error.code).toBeUndefined();
  });
});

describe('api client', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test('sends the app language, not the browser language', async () => {
    const calls: RequestInit[] = [];
    globalThis.fetch = mock(async (_input: RequestInfo | URL, init?: RequestInit) => {
      calls.push(init ?? {});
      return new Response('{}', { status: 200 });
    }) as unknown as typeof fetch;

    await api.api.auth['forgot-password'].$post({ json: { email: 'a@example.com' } });

    const headers = new Headers(calls[0]?.headers);
    expect(headers.get('Accept-Language')).toBe('en');
    expect(headers.get('Content-Type')).toContain('application/json');
  });
});
