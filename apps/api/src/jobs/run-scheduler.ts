import { Cron } from 'croner';
import { env } from '../lib/env';
import { runPricingRefresh } from './pricing-refresh';

console.log(`Pricing scheduler started (schedule: ${env.jobSchedule})`);

new Cron(env.jobSchedule, async () => {
  try {
    const result = await runPricingRefresh();
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error('Pricing refresh failed:', error);
  }
});

process.stdin.resume();
