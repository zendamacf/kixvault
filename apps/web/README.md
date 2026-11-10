# KixVault Web

## Visual design

Styling is Tailwind v4 with the tokens in `src/index.css`.

- **Surfaces:** the page is a grey "stage" (`bg-background`). Shoes, summaries and tables sit on "plinths" (`bg-card`). Form fields use `bg-card` too, so they stand out against the stage. Avoid nesting card-coloured blocks inside each other.
- **Themes:** each sneaker colorway is a standalone theme (Shattered Backboard is the default, plus Chicago, UNC, Panda, Bred, Royal and Mocha). `src/components/theme/themes.ts` is the registry, and each theme has a `[data-theme='id']` block of tokens in `src/index.css`. The `dark:` variant applies to themes with `mode: 'dark'`. To add one, add a registry entry, a token block, and its id to the `dark` custom variant if it is dark; `themes.unit.test.ts` checks these agree.
- **Accent:** `primary` is the colorway's accent and its `primary-foreground` is chosen per theme so the pair meets WCAG AA (white on box orange fails, so Shattered Backboard uses dark text). Do not use the accent for small text. Money uses `text-gain` and `text-loss`.
- **Chrome:** the header and the auth brand panel use the `chrome` tokens, which are dark in every theme.
- **Type:** Geist for body text and Bricolage Grotesque for headings, the wordmark and prices (`font-heading`).
- **Sneaker artwork:** the brand mark and silhouette share `src/components/layout/sneaker-art.ts`. `public/favicon.svg` is a static copy, and `sneaker-art.unit.test.ts` fails if the two drift apart.
- **Motion:** the brand mark's eyelets animate on hover, and only colours change. Avoid rotate and scale on small graphics, which render with jagged edges. The only other motion is the confetti in `src/lib/celebrate.ts`, shown when a sneaker is added or a grail moves to the collection. It is off when the user prefers reduced motion.

## Internationalization

The app uses [i18next](https://www.i18next.com/) and [react-i18next](https://react.i18next.com/). English (`en`, US spelling) is the only locale today and the fallback for any other.

- Message catalogs live in `src/i18n/locales/<locale>.json`. `src/i18n/index.ts` registers them and is imported by `src/main.tsx` and the test preload.
- In components use `const { t } = useTranslation();`. Outside components (`src/lib`) use `i18n.t(...)` from `@/i18n`.
- Sentences with markup use `<Trans i18nKey="..." components={{ strong: <strong /> }} />`, with the tags written in the string (`"<strong>{{count}}</strong> grails"`).
- Counts use plural keys: `pairCount_one` and `pairCount_other`, called as `t('pairCount', { count })`.
- Currency and date formatting in `src/lib/utils.ts` read the active locale through `getActiveLocale()`.

### Adding strings

1. Add a key to `src/i18n/locales/en.json`, grouped by feature (`login.*`, `grails.*`). Use US spelling ("color", "gray").
2. Replace the hard-coded copy with `t('your.key')`. Keep the key a string literal where you can: `i18n.unit.test.ts` scans the source and fails if a literal key is missing from `en.json`. Keys built at runtime (`` t(`condition.${value}`) ``) are not checked, so add every variant.
3. Never concatenate translated fragments into a sentence. Give the whole sentence one key with `{{placeholders}}`, because word order differs between languages.
4. Run `bun run lint` and `bun test` in `apps/web`.

### Adding a language

Using French (`fr`) as the example:

1. **Web catalog.** Copy `src/i18n/locales/en.json` to `fr.json` and translate the values. Keep every key, `{{placeholder}}` and `<tag>` as they are. Plural suffixes follow the language's [plural categories](https://www.i18next.com/translation-function/plurals): French needs `_one`, `_many` and `_other`, while Russian also needs `_few`.
2. **Register it.** In `src/i18n/index.ts`, import the file, add `fr: { translation: fr }` to `resources`, and add `'fr'` to `supportedLocales`.
3. **Choose when it is used.** The app currently starts in `defaultLocale` and never detects a language. Add a language picker that calls `i18n.changeLanguage('fr')`, or `i18next-browser-languagedetector`, and persist the choice. Also set `<html lang>` from the active language.
4. **Emails.** Emails are rendered by the API, with their own catalog:
   - Copy `apps/api/src/lib/email/locales/en.json` to `fr.json` and translate it.
   - In `apps/api/src/lib/email/i18n.ts`, import it, add it to `resources`, and add `'fr'` to `supportedEmailLocales`.
   - Nothing else is needed. `src/lib/api.ts` sends `Accept-Language: <getActiveLocale()>` on every request, the API's locale middleware picks the best supported match, and the auth routes pass it to the email templates. The UI and the emails therefore always use the same language.
5. **Check it.** Add the locale to the tests (`i18n.unit.test.ts` for the web, `templates.unit.test.ts` for emails) and compare the new file's keys against `en.json`. Most existing tests assert English copy, so they keep running against `en`.

Not covered by the catalogs yet: error messages returned by the API (for example "Sneaker not found") and the validation messages in `packages/shared`. They are English-only and shown as-is.
