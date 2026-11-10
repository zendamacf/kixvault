import { APP_NAME } from '@kixvault/shared';
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
};

export function verifyEmailTemplate({
  verifyUrl,
  expiresInHours,
}: VerifyEmailProps): RenderedEmail {
  const expiry = `This link expires in ${expiresInHours} hours and works once. If you did not create a ${APP_NAME} account, ignore this email.`;

  return {
    subject: `Confirm your ${APP_NAME} email`,
    html: renderLayout(
      [
        renderHeading('Confirm your email'),
        renderParagraph(
          `Welcome to ${APP_NAME}. Confirm your email address to finish creating your vault.`,
        ),
        `<p style="margin:0 0 24px;">${renderButton(verifyUrl, 'Confirm email')}</p>`,
        renderMuted(expiry),
        renderLinkFallback(verifyUrl),
      ].join('\n'),
    ),
    text: `Welcome to ${APP_NAME}.\n\nConfirm your email address: ${verifyUrl}\n\n${expiry}`,
  };
}
