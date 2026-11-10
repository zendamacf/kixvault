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

export type ResetPasswordEmailProps = {
  resetUrl: string;
  expiresInMinutes: number;
};

export function resetPasswordEmailTemplate({
  resetUrl,
  expiresInMinutes,
}: ResetPasswordEmailProps): RenderedEmail {
  const expiry = `This link expires in ${expiresInMinutes} minutes and works once. If you did not ask to reset your password, ignore this email and your password stays the same.`;

  return {
    subject: `Reset your ${APP_NAME} password`,
    html: renderLayout(
      [
        renderHeading('Reset your password'),
        renderParagraph(`Someone asked to reset the password for your ${APP_NAME} account.`),
        `<p style="margin:0 0 24px;">${renderButton(resetUrl, 'Choose a new password')}</p>`,
        renderMuted(expiry),
        renderLinkFallback(resetUrl),
      ].join('\n'),
    ),
    text: `Someone asked to reset the password for your ${APP_NAME} account.\n\nChoose a new password: ${resetUrl}\n\n${expiry}`,
  };
}
