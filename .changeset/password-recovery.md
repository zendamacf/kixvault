---
'@kixvault/api': minor
'@kixvault/web': minor
'@kixvault/shared': minor
'@kixvault/db': minor
---

Add password recovery. Verified accounts can request a single-use, one-hour reset link by email. Requests are rate limited to reduce chances of abuse, and a successful reset signs out every existing session.
