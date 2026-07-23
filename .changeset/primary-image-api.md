---
"@kixvault/api": minor
"@kixvault/db": minor
"@kixvault/shared": minor
"@kixvault/web": patch
---

Enforce a single primary image per sneaker (360 gallery frames remain separate), return `primaryImage` from the API instead of an `images` array, and serve stored primary images at `/api/images/:sneakerId`.
