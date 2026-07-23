import { describe, expect, mock, test } from 'bun:test';
import type { CatalogSource } from '@kixvault/shared';
import {
  dedupeCatalogProducts,
  getWeekStartUtc,
  hasCompletedRefreshThisWeek,
} from './pricing-refresh-helpers';

describe('getWeekStartUtc', () => {
  test('returns Sunday 00:00 UTC for the current week', () => {
    const weekStart = getWeekStartUtc(new Date('2026-07-22T15:30:00.000Z'));

    expect(weekStart.toISOString()).toBe('2026-07-19T00:00:00.000Z');
  });
});

describe('hasCompletedRefreshThisWeek', () => {
  test('returns true when a completed run started this week', () => {
    const now = new Date('2026-07-22T15:30:00.000Z');

    expect(
      hasCompletedRefreshThisWeek([{ startedAt: new Date('2026-07-20T03:00:00.000Z') }], now),
    ).toBe(true);
  });

  test('returns false when the latest completed run was last week', () => {
    const now = new Date('2026-07-22T15:30:00.000Z');

    expect(
      hasCompletedRefreshThisWeek([{ startedAt: new Date('2026-07-18T03:00:00.000Z') }], now),
    ).toBe(false);
  });
});

describe('dedupeCatalogProducts', () => {
  test('deduplicates sneakers by catalog product', () => {
    const rows = [
      {
        catalogSource: 'kicksdb:stockx' as CatalogSource,
        catalogId: 'air-jordan-1',
        sku: 'DZ5485-612',
        size: '10',
      },
      {
        catalogSource: 'kicksdb:stockx' as CatalogSource,
        catalogId: 'air-jordan-1',
        sku: 'DZ5485-612',
        size: '11',
      },
      {
        catalogSource: 'kicksdb:stockx' as CatalogSource,
        catalogId: 'nike-dunk',
        sku: 'DD1391-100',
        size: '9',
      },
    ];

    const products = dedupeCatalogProducts(rows);

    expect(products.size).toBe(2);
    expect(products.get('kicksdb:stockx:air-jordan-1')?.size).toBe('10');
    expect(products.get('kicksdb:stockx:nike-dunk')?.size).toBe('9');
  });
});

describe('runPricingRefresh', () => {
  test('skips when KicksDB is not configured', async () => {
    mock.module('../lib/env', () => ({
      env: {
        databaseUrl: 'postgresql://example.com/db',
        kicksdbApiKey: undefined,
        pricingRefreshDelayMs: 0,
        jobSchedule: '0 3 * * 0',
      },
    }));

    mock.module('../lib/kicksdb', () => ({
      isKicksdbConfigured: () => false,
      ensureKicksdbClient: () => {},
    }));

    const { runPricingRefresh } = await import('./pricing-refresh');
    const result = await runPricingRefresh();

    expect(result).toEqual({ status: 'skipped', reason: 'kicksdb_not_configured' });
  });
});
