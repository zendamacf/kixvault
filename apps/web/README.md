# KixVault Web

## Visual design

Styling is Tailwind v4 with the tokens in `src/index.css`.

- **Surfaces:** the page is a grey "stage" (`bg-background`). Shoes, summaries and tables sit on "plinths" (`bg-card`). Form fields use `bg-card` too, so they stand out against the stage. Avoid nesting card-coloured blocks inside each other.
- **Accent:** box orange (`primary`) is the only accent and carries dark text (`primary-foreground`), because white on this orange fails contrast. Do not use orange for small text. Money uses `text-gain` and `text-loss`.
- **Chrome:** the header and the auth brand panel use the `chrome` tokens (ink in both themes).
- **Type:** Geist for body text and Bricolage Grotesque for headings, the wordmark and prices (`font-heading`).
- **Sneaker artwork:** the brand mark and silhouette share `src/components/layout/sneaker-art.ts`. `public/favicon.svg` is a static copy, and `sneaker-art.unit.test.ts` fails if the two drift apart.
- **Motion:** only the brand mark's eyelets animate on hover, and only colours change. Avoid rotate and scale on small graphics, which render with jagged edges.

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
