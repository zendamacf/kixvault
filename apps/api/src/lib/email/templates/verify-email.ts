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

export type VerifyEmailProps = {
  verifyUrl: string;
  expiresInHours: number;
  /** Defaults to English. */
  locale?: string;
};

export function verifyEmailTemplate({
  verifyUrl,
  expiresInHours,
  locale,
}: VerifyEmailProps): RenderedEmail {
  const resolvedLocale = resolveEmailLocale(locale);
  const t = getEmailT(resolvedLocale);
  const appName = APP_NAME;
  const expiry = t('verifyEmail.expiry', { count: expiresInHours, appName });

  return {
    subject: t('verifyEmail.subject', { appName }),
    html: renderLayout(
      [
        renderHeading(t('verifyEmail.heading')),
        renderParagraph(t('verifyEmail.intro', { appName })),
        `<p style="margin:0 0 24px;">${renderButton(verifyUrl, t('verifyEmail.action'))}</p>`,
        renderMuted(expiry),
        renderLinkFallback(verifyUrl, t),
      ].join('\n'),
      t,
      resolvedLocale,
    ),
    text: `${t('verifyEmail.textIntro', { appName })}\n\n${t('verifyEmail.textAction', { url: verifyUrl })}\n\n${expiry}`,
  };
}
