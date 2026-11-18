import { Cron } from 'croner';
import { env } from '../lib/env';
import { getStoredRates } from '../lib/exchange-rates';
import { logger } from '../lib/logger';
import { ratesAreStale, runExchangeRatesRefresh } from './exchange-rates-refresh';
import { runPricingRefresh } from './pricing-refresh';

async function refreshPricing() {
  try {
    logger.log('Running pricing refresh');
    const result = await runPricingRefresh();
    logger.log(JSON.stringify(result));
  } catch (error) {
    logger.error('Pricing refresh failed:', error);
  }
}

async function refreshExchangeRates() {
  try {
    logger.log('Running exchange rates refresh');
    const result = await runExchangeRatesRefresh();
    logger.log(JSON.stringify(result));
  } catch (error) {
    logger.error('Exchange rates refresh failed:', error);
  }
}

/** Starts the pricing and exchange-rate cron jobs. Returns a function that stops them. */
export function startScheduler(): () => void {
  logger.log(`Pricing scheduler started (schedule: ${env.jobSchedule})`);
  logger.log(`Exchange rates scheduler started (schedule: ${env.exchangeRatesSchedule})`);

  const jobs = [
    new Cron(env.jobSchedule, refreshPricing),
    new Cron(env.exchangeRatesSchedule, refreshExchangeRates),
  ];

  // Populate rates on first boot instead of waiting for the next scheduled run.
  getStoredRates()
    .then(({ updatedAt }) => (ratesAreStale(updatedAt) ? refreshExchangeRates() : undefined))
    .catch((error) => logger.error('Exchange rates startup check failed:', error));

  return () => {
    for (const job of jobs) job.stop();
  };
}
