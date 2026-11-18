# CSV export

**Export CSV** on the settings page downloads the pairs currently in your vault as a CSV file. The same file is available from `GET /api/sneakers/export?format=csv` (needs a session).

- Only your own pairs, oldest first (by the date they were added). Retired pairs, grails, wears and images are not included.
- UTF-8 with a byte order mark so Excel reads non-ASCII text correctly. Lines end in CRLF.
- Fields follow RFC 4180. Text starting with `=`, `+`, `-`, `@`, tab or carriage return gets a leading `'` so spreadsheets do not run it as a formula.
- Empty values are empty cells.
- Limited to 5 exports per minute per user. Each export is listed in the [activity log](activity-log.md).

## Columns

The header names and their order are stable. **Changing, renaming, reordering or removing a column is a breaking change** and needs a major version bump. Adding a column at the end is not.

| Header | Value |
|--------|-------|
| `brand` | Brand |
| `model` | Model |
| `colorway` | Colorway |
| `nickname` | Nickname |
| `sku` | SKU |
| `size` | US size, for example `10` or `9.5` |
| `condition` | `deadstock`, `lightly_worn`, `worn` or `beat` |
| `purchase_price` | Number in USD, no currency symbol |
| `purchase_date` | `YYYY-MM-DD` |
| `release_date` | `YYYY-MM-DD` |
| `market_value` | Current market value in USD. Empty when unknown |
| `market_value_currency` | Always `USD` |
| `wear_count` | Number of wears logged |
| `last_worn` | Latest wear, `YYYY-MM-DD`. Empty if never worn |
| `notes` | Notes |
| `added_at` | When the pair was added, ISO 8601 in UTC |

Amounts are always USD, whatever display currency you picked.
