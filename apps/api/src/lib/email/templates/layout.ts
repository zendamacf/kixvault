import { APP_NAME } from '@kixvault/shared';
import type { TFunction } from 'i18next';

/**
 * Colors mirror the default KixVault theme (apps/web/src/index.css) and the app icon
 * (apps/web/public/favicon.svg). Email clients cannot read CSS variables, so values are
 * written out here. Keep them in sync with the theme.
 */
export const emailColors = {
  light: {
    page: '#e9e9e7',
    card: '#fbfbf9',
    text: '#121317',
    muted: '#50545e',
    border: '#cbccc7',
  },
  dark: {
    page: '#121317',
    card: '#1b1d23',
    text: '#f9f9f7',
    muted: '#a7abb4',
    border: '#2e3139',
  },
  /** Box orange. Carries dark text: white on this orange fails contrast. */
  brand: '#ff5a1f',
  brandText: '#121317',
  /** Ink header band, as on the sign in panel. */
  chrome: '#121317',
  chromeText: '#f9f9f7',
} as const;

export const FONT_STACK = "Geist, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
export const HEADING_FONT_STACK = `'Bricolage Grotesque', ${FONT_STACK}`;

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Heading in the app's heading font. */
export function renderHeading(text: string): string {
  return `<h1 style="font-family:${HEADING_FONT_STACK};font-size:26px;line-height:1.15;font-weight:600;letter-spacing:-0.02em;margin:0 0 12px;">${escapeHtml(text)}</h1>`;
}

/** Body paragraph. Pass plain text: it is escaped here. */
export function renderParagraph(text: string): string {
  return `<p style="margin:0 0 20px;">${escapeHtml(text)}</p>`;
}

/** Secondary text. Uses the `.muted` class so dark mode can recolor it. */
export function renderMuted(text: string): string {
  return `<p class="muted" style="margin:0 0 12px;font-size:13px;color:${emailColors.light.muted};">${escapeHtml(text)}</p>`;
}

/** Primary call to action, styled like the app's primary button. */
export function renderButton(href: string, label: string): string {
  return `<a class="btn" href="${escapeHtml(href)}" style="display:inline-block;padding:12px 22px;background:${emailColors.brand};color:${emailColors.brandText};border-radius:8px;font-weight:600;text-decoration:none;">${escapeHtml(label)}</a>`;
}

/** Fallback for clients that block buttons: the raw link as plain text. */
export function renderLinkFallback(href: string, t: TFunction): string {
  return `<p class="muted" style="margin:16px 0 0;font-size:12px;color:${emailColors.light.muted};word-break:break-all;">${escapeHtml(t('common.linkFallback'))}<br>${escapeHtml(href)}</p>`;
}

/**
 * Shared HTML shell for every transactional email: ink header with the wordmark, themed card,
 * light and dark mode (through prefers-color-scheme where the client supports it).
 * `bodyHtml` must already be escaped: build it with the render helpers above. `t` is fixed to the
 * email's locale, which also sets the document language.
 */
export function renderLayout(bodyHtml: string, t: TFunction, locale: string): string {
  const l = emailColors.light;
  const d = emailColors.dark;
  return `<!doctype html>
<html lang="${escapeHtml(locale)}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;800&family=Geist:wght@400;600&display=swap" rel="stylesheet">
    <style>
      @media (prefers-color-scheme: dark) {
        .page { background: ${d.page} !important; }
        .card { background: ${d.card} !important; color: ${d.text} !important; border-color: ${d.border} !important; }
        .muted { color: ${d.muted} !important; }
      }
    </style>
  </head>
  <body class="page" style="margin:0;padding:24px 16px;background:${l.page};font-family:${FONT_STACK};">
    <div style="max-width:480px;margin:0 auto;">
      <div style="background:${emailColors.chrome};border-radius:16px 16px 0 0;padding:18px 28px;">
        <span style="display:inline-block;width:28px;height:28px;border-radius:7px;background:${emailColors.brand};vertical-align:middle;"></span>
        <span style="font-family:${HEADING_FONT_STACK};font-size:20px;font-weight:800;letter-spacing:-0.02em;color:${emailColors.chromeText};vertical-align:middle;margin-left:10px;">${escapeHtml(APP_NAME)}</span>
      </div>
      <div class="card" style="background:${l.card};color:${l.text};border:1px solid ${l.border};border-top:0;border-radius:0 0 16px 16px;padding:28px;font-size:16px;line-height:1.5;">
        ${bodyHtml}
        <p class="muted" style="margin:28px 0 0;font-size:12px;color:${l.muted};">${escapeHtml(t('common.signOff', { appName: APP_NAME }))}</p>
      </div>
    </div>
  </body>
</html>`;
}
