import { describe, expect, test } from 'bun:test';
import { parseApiError } from './api';

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
