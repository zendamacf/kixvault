---
"@kixvault/api": minor
---

Add `POST /api/sneakers/:id/retire` and `POST /api/sneakers/:id/restore`. The sneaker list returns active pairs by default. Use `status=retired` or `status=all` to see retired pairs. Retired pairs cannot get new wears. They are not in the collection summary or the analytics counts. The collection value chart stops counting a pair after its departure date. Analytics now show the realized gain or loss of sold pairs.
