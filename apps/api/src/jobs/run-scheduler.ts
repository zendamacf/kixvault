import { Cron } from 'croner';
import { env } from '../lib/env';
import { logger } from '../lib/logger';
import { runPricingRefresh } from './pricing-refresh';

logger.log(`Pricing scheduler started (schedule: ${env.jobSchedule})`);

new Cron(env.jobSchedule, async () => {
  try {
    logger.log('Running pricing refresh');
    const result = await runPricingRefresh();
    logger.log(JSON.stringify(result));
  } catch (error) {
    logger.error('Pricing refresh failed:', error);
  }
});

process.stdin.resume();
