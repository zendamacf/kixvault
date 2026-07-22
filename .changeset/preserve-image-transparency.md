---
"@kixvault/api": patch
---

Preserve transparent backgrounds when fetching sneaker images by stripping StockX background CDN params, requesting imgix background removal, and retaining alpha during WebP conversion.
