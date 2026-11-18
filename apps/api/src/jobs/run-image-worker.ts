// Deprecated: kept so older deployments keep working. Use run-jobs.ts instead.
import { startImageWorker } from './image-worker';

startImageWorker();

process.stdin.resume();
