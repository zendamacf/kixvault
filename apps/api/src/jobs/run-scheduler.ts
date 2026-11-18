// Standalone entrypoint, for deployments that run the scheduler in its own container.
import { startScheduler } from './scheduler';

startScheduler();

process.stdin.resume();
