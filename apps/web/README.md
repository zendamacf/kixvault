# KixVault Web

## Visual design

Styling is Tailwind v4 with the tokens in `src/index.css`.

- **Surfaces:** the page is a grey "stage" (`bg-background`). Shoes, summaries and tables sit on "plinths" (`bg-card`). Form fields use `bg-card` too, so they stand out against the stage. Avoid nesting card-coloured blocks inside each other.
- **Themes:** each sneaker colorway is a standalone theme (Shattered Backboard is the default, plus Chicago, UNC, Panda, Bred, Royal and Mocha). `src/components/theme/themes.ts` is the registry, and each theme has a `[data-theme='id']` block of tokens in `src/index.css`. The `dark:` variant applies to themes with `mode: 'dark'`. To add one, add a registry entry, a token block, and its id to the `dark` custom variant if it is dark; `themes.unit.test.ts` checks these agree.
- **Accent:** `primary` is the colorway's accent and its `primary-foreground` is chosen per theme so the pair meets WCAG AA (white on box orange fails, so Shattered Backboard uses dark text). Do not use the accent for small text. Money uses `text-gain` and `text-loss`.
- **Chrome:** the header and the auth brand panel use the `chrome` tokens, which are dark in every theme.
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
