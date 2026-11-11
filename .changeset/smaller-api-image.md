---
"@kixvault/api": patch
"@kixvault/db": patch
---

Make the API Docker image smaller. Use the Alpine base image. Install only production dependencies. Run migrations with a script instead of drizzle-kit.
