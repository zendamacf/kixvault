# KixVault Web

## Internationalization

The app uses [i18next](https://www.i18next.com/) and [react-i18next](https://react.i18next.com/) with English (`en`) as the default locale.

- Message catalogs live in `src/i18n/locales/<locale>.json`.
- Initialize i18n in `src/i18n/index.ts` (imported from `src/main.tsx` and the test preload).
- Use `useTranslation()` in components: `const { t } = useTranslation();` then `t('login.title')`.
- Currency and date formatting in `src/lib/utils.ts` read the active locale via `getActiveLocale()`.

### Adding strings

1. Add a key to `src/i18n/locales/en.json` (use nested groups such as `login.*` or `dashboard.*`).
2. Replace hard-coded copy in the component with `t('your.key')`.
3. Extend `src/i18n/i18n.unit.test.ts` when introducing a new screen-level namespace.
4. Run `bun run lint` and `bun test` in `apps/web`.

Additional locales can be added later by creating a new JSON file, registering it in `src/i18n/index.ts`, and appending the code to `supportedLocales`.
