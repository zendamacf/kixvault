import { describe, expect, mock, test } from 'bun:test';

const mockConfigured = mock(() => false);
const mockFetch = mock(async () => ({ EUR: 0.9 }));
const mockUpsert = mock(async () => 1);

mock.module('../lib/exchange-rates', () => ({
  isExchangeRatesConfigured: mockConfigured,
  fetchLatestRates: mockFetch,
  upsertRates: mockUpsert,
}));

const { ratesAreStale, runExchangeRatesRefresh } = await import('./exchange-rates-refresh');

describe('runExchangeRatesRefresh', () => {
  test('skips when no app id is configured', async () => {
    mockConfigured.mockReturnValue(false);

    expect(await runExchangeRatesRefresh()).toEqual({
      status: 'skipped',
      reason: 'not_configured',
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('fetches and stores rates when configured', async () => {
    mockConfigured.mockReturnValue(true);

    expect(await runExchangeRatesRefresh()).toEqual({ status: 'completed', ratesUpdated: 1 });
    expect(mockUpsert).toHaveBeenCalledWith({ EUR: 0.9 });
  });
});

describe('ratesAreStale', () => {
  const now = new Date('2026-11-18T12:00:00Z');

  test('is stale with no rates or an old timestamp', () => {
    expect(ratesAreStale(null, now)).toBe(true);
    expect(ratesAreStale('2026-11-16T12:00:00Z', now)).toBe(true);
  });

  test('is fresh within a day', () => {
    expect(ratesAreStale('2026-11-18T01:00:00Z', now)).toBe(false);
  });
});
