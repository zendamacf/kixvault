---
"@kixvault/api": minor
---

Add one `jobs` entrypoint that runs the scheduler and the image worker in one container. Use `apps/api/dist/jobs/run-jobs.js` in place of the `scheduler` and `image-worker` containers. The old entrypoints still work, but they are deprecated.
