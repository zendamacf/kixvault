// Deprecated: kept so older deployments keep working. Use run-jobs.ts instead.
import { startScheduler } from './scheduler';

startScheduler();

process.stdin.resume();
