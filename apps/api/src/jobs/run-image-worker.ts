// Standalone entrypoint, for deployments that run the image worker in its own container.
import { startImageWorker } from './image-worker';

startImageWorker();

process.stdin.resume();
