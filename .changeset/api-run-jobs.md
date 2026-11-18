---
"@kixvault/api": minor
---

The API now runs the scheduler and the image worker in the same process, so a deployment needs only the `api` container. Set `RUN_JOBS=false` to turn this off.

If you use separate `scheduler` and `image-worker` containers, remove them, or set `RUN_JOBS=false` on the `api` service. If you do not, the jobs run two times.
