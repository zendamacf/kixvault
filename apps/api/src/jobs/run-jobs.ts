// Entrypoint for the `jobs` container: runs the scheduler and the image worker in one process.
import { startImageWorker } from './image-worker';
import { startScheduler } from './scheduler';

startScheduler();
startImageWorker();

process.stdin.resume();
