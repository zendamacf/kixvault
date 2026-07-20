---
"@kixvault/api": patch
"@kixvault/web": patch
---

Pass `SENTRY_AUTH_TOKEN` as a Docker BuildKit secret during image builds instead of a build arg.
