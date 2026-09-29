---
"@kixvault/api": patch
---

Add global per-IP API rate limiting, Redis-backed shared counters when `REDIS_URL` is set, and stricter limits on auth endpoints. Closes #95.
