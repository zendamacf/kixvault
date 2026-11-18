---
"@kixvault/api": minor
---

Add one `jobs` container that runs the scheduler and the image worker. Use the `apps/api/dist/jobs/run-jobs.js` entrypoint.

Breaking: the `run-scheduler.js` and `run-image-worker.js` entrypoints are removed. Replace the `scheduler` and `image-worker` services with one `jobs` service. See `docs/deployment.md`.
