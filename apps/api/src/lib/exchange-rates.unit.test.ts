import { beforeEach, describe, expect, mock, test } from 'bun:test';

const envMock = { databaseUrl: 'postgresql://example.com/db', openExchangeRatesAppId: 'app-id' };

mock.module('./env', () => ({ env: envMock }));
mock.module('./db', () => ({ db: {} }));

const { fetchLatestRates, parseRates } = await import('./exchange-rates');

describe('parseRates', () => {
  test('keeps supported, positive, finite rates and drops the rest', () => {
    expect(
      parseRates({ EUR: 0.9, GBP: 0, JPY: Number.NaN, CAD: '1.3', XXX: 5, USD: 1, AUD: 1.5 }),
    ).toEqual({ EUR: 0.9, AUD: 1.5 });
  });

  test('returns an empty object when rates are missing', () => {
    expect(parseRates(undefined)).toEqual({});
  });
});

describe('fetchLatestRates', () => {
  beforeEach(() => {
    envMock.openExchangeRatesAppId = 'app-id';
  });

  test('requests supported symbols with the app id and parses the response', async () => {
    const fetchImpl = mock(
      async (_url: string | URL | Request) =>
        new Response(JSON.stringify({ rates: { EUR: 0.92, JPY: 150.1 } })),
    );

    const rates = await fetchLatestRates(fetchImpl as unknown as typeof fetch);
    const url = String(fetchImpl.mock.calls[0]?.[0]);

    expect(rates).toEqual({ EUR: 0.92, JPY: 150.1 });
    expect(url).toContain('app_id=app-id');
    expect(url).toContain('symbols=EUR,GBP');
    expect(url).not.toContain('USD,');
  });

  test('does not leak the app id in error messages', async () => {
    const fetchImpl = async () => new Response('nope', { status: 401 });

    const error = await fetchLatestRates(fetchImpl as unknown as typeof fetch).catch((e) => e);

    expect(error).toBeInstanceOf(Error);
    expect(String(error.message)).toContain('401');
    expect(String(error.message)).not.toContain('app-id');
  });

  test('throws when no app id is configured', async () => {
    envMock.openExchangeRatesAppId = undefined as unknown as string;

    await expect(fetchLatestRates(mock() as unknown as typeof fetch)).rejects.toThrow(
      'OPENEXCHANGERATES_APP_ID',
    );
  });
});
