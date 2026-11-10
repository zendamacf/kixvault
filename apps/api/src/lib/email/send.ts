import * as Sentry from '@sentry/bun';
import { env } from '../env';
import { logger } from '../logger';
import { getEmailFrom, getEmailProvider } from './config';
import { type EmailTemplateProps, type EmailType, emailTemplates } from './templates';

/**
 * Renders and sends a typed email. Never throws: failures are logged and reported, so a
 * delivery problem cannot change an API response. Returns whether the provider took the message.
 */
export async function sendEmail<T extends EmailType>(
  type: T,
  to: string,
  props: EmailTemplateProps[T],
): Promise<boolean> {
  try {
    const rendered = emailTemplates[type](props);
    await getEmailProvider().send({ to, ...rendered }, getEmailFrom());
    return true;
  } catch (error) {
    logger.error('Failed to send email', { type, error });
    if (env.isProduction) {
      Sentry.captureException(error, { tags: { emailType: type } });
    }
    return false;
  }
}
