import { env } from '../../env';
import { logger } from '../../logger';
import type { EmailProvider } from '../types';

/** Logs emails instead of sending them. Used when no Resend API key is configured. */
export const consoleProvider: EmailProvider = {
  name: 'console',
  async send(message, from) {
    logger.info('Email (console provider, not sent)', {
      from,
      to: message.to,
      subject: message.subject,
      // Bodies can hold secrets such as links, so only log them outside production.
      ...(env.isProduction ? {} : { text: message.text }),
    });
  },
};
