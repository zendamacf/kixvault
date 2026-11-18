import { exchangeRates } from '@kixvault/db';
import { BASE_CURRENCY, type ExchangeRatesResponse, SUPPORTED_CURRENCIES } from '@kixvault/shared';
import { sql } from 'drizzle-orm';
import { db } from './db';
import { env } from './env';

const OXR_LATEST_URL = 'https://openexchangerates.org/api/latest.json';

export function isExchangeRatesConfigured(): boolean {
  return Boolean(env.openExchangeRatesAppId);
}

/**
 * Fetches USD-based rates for the supported currencies from Open Exchange Rates.
 * The free plan only serves USD as the base, which is the base we want.
 */
export async function fetchLatestRates(
  fetchImpl: typeof fetch = fetch,
): Promise<Record<string, number>> {
  const appId = env.openExchangeRatesAppId;
  if (!appId) {
    throw new Error('OPENEXCHANGERATES_APP_ID is not configured');
  }

  const symbols = SUPPORTED_CURRENCIES.filter((code) => code !== BASE_CURRENCY).join(',');
  const url = `${OXR_LATEST_URL}?app_id=${encodeURIComponent(appId)}&symbols=${symbols}`;
  const response = await fetchImpl(url, { signal: AbortSignal.timeout(15_000) });

  if (!response.ok) {
    // Never include the URL: it carries the app ID.
    throw new Error(`Open Exchange Rates request failed with status ${response.status}`);
  }

  const body = (await response.json()) as { rates?: Record<string, unknown> };
  return parseRates(body.rates);
}

/** Keeps only supported, finite, positive rates. */
export function parseRates(raw: Record<string, unknown> | undefined): Record<string, number> {
  const rates: Record<string, number> = {};
  if (!raw) {
    return rates;
  }

  for (const code of SUPPORTED_CURRENCIES) {
    const value = raw[code];
    if (
      code !== BASE_CURRENCY &&
      typeof value === 'number' &&
      Number.isFinite(value) &&
      value > 0
    ) {
      rates[code] = value;
    }
  }

  return rates;
}

export async function upsertRates(rates: Record<string, number>, fetchedAt = new Date()) {
  const rows = Object.entries(rates).map(([currency, rate]) => ({
    currency,
    rate: rate.toFixed(8),
    fetchedAt,
  }));

  if (rows.length === 0) {
    return 0;
  }

  await db
    .insert(exchangeRates)
    .values(rows)
    .onConflictDoUpdate({
      target: exchangeRates.currency,
      set: {
        rate: sql`excluded.rate`,
        fetchedAt: sql`excluded.fetched_at`,
      },
    });

  return rows.length;
}

export async function getStoredRates(): Promise<ExchangeRatesResponse> {
  const rows = await db.select().from(exchangeRates);
  const rates: Record<string, number> = { [BASE_CURRENCY]: 1 };
  let updatedAt: Date | null = null;

  for (const row of rows) {
    rates[row.currency] = Number(row.rate);
    if (!updatedAt || row.fetchedAt > updatedAt) {
      updatedAt = row.fetchedAt;
    }
  }

  return { base: 'USD', rates, updatedAt: updatedAt?.toISOString() ?? null };
}
