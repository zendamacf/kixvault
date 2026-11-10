import { APP_NAME } from '@kixvault/shared';
import { getEmailT, resolveEmailLocale } from '../i18n';
import type { RenderedEmail } from './index';
import {
  renderButton,
  renderHeading,
  renderLayout,
  renderLinkFallback,
  renderMuted,
  renderParagraph,
} from './layout';

export type ResetPasswordEmailProps = {
  resetUrl: string;
  expiresInMinutes: number;
  /** Defaults to English. */
  locale?: string;
};

export function resetPasswordEmailTemplate({
  resetUrl,
  expiresInMinutes,
  locale,
}: ResetPasswordEmailProps): RenderedEmail {
  const resolvedLocale = resolveEmailLocale(locale);
  const t = getEmailT(resolvedLocale);
  const appName = APP_NAME;
  const intro = t('resetPassword.intro', { appName });
  const expiry = t('resetPassword.expiry', { count: expiresInMinutes });

  return {
    subject: t('resetPassword.subject', { appName }),
    html: renderLayout(
      [
        renderHeading(t('resetPassword.heading')),
        renderParagraph(intro),
        `<p style="margin:0 0 24px;">${renderButton(resetUrl, t('resetPassword.action'))}</p>`,
        renderMuted(expiry),
        renderLinkFallback(resetUrl, t),
      ].join('\n'),
      t,
      resolvedLocale,
    ),
    text: `${intro}\n\n${t('resetPassword.textAction', { url: resetUrl })}\n\n${expiry}`,
  };
}
