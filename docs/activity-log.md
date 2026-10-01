# Account activity log

Signed-in users can open **Activity** from the profile menu in the top bar. It lists recent sign-ins and collection changes for their account only.

## Retention

Events older than **90 days** are not returned in the activity feed. Stored rows may remain in the database until a future cleanup job is added; the API always enforces the 90-day window when listing events.

## What is recorded

- Sign-in, sign-out, and account creation
- Adding, updating, or removing sneakers (brand and model names only in the timeline; notes and other personal fields are not copied into the log)

IP addresses may be stored server-side for security but are not shown in the activity page.
