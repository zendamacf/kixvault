---
"@kixvault/api": patch
"@kixvault/web": patch
---

Stop passing `github.repository` as `SENTRY_REPO` during Docker builds and make commit association non-fatal when the repo is not linked in Sentry.
