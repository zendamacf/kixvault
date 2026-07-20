---
"@kixvault/web": patch
---

Fixed web Docker source map uploads by installing CA certificates, setting an explicit Sentry release name, and removing map files after upload. Removed the unnecessary `SENTRY_RELEASE` override from deployment documentation.
