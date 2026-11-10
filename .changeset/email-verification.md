---
'@kixvault/api': minor
'@kixvault/web': minor
'@kixvault/shared': minor
'@kixvault/db': minor
---

Add email verification for new signups. When a Resend API key is set, new accounts must confirm their email before they can sign in. Without a key, emails are logged to the console and signups work as before.
