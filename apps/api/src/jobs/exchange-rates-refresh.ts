import { fetchLatestRates, isExchangeRatesConfigured, upsertRates } from '../lib/exchange-rates';

export type ExchangeRatesRefreshResult =
  | { status: 'skipped'; reason: 'not_configured' }
  | { status: 'completed'; ratesUpdated: number };

export async function runExchangeRatesRefresh(): Promise<ExchangeRatesRefreshResult> {
  if (!isExchangeRatesConfigured()) {
    return { status: 'skipped', reason: 'not_configured' };
  }

  const rates = await fetchLatestRates();
  const ratesUpdated = await upsertRates(rates);

  return { status: 'completed', ratesUpdated };
}

/** True when there are no stored rates, or the newest is older than `maxAgeMs`. */
export function ratesAreStale(updatedAt: string | null, now = new Date(), maxAgeMs = 86_400_000) {
  return !updatedAt || now.getTime() - new Date(updatedAt).getTime() > maxAgeMs;
}
