import { env } from '../env';
import { consoleProvider } from './providers/console';
import { createResendProvider } from './providers/resend';
import type { EmailProvider } from './types';

/** True when a real provider is configured. Otherwise emails are only logged. */
export function isEmailEnabled(): boolean {
  return Boolean(env.resendApiKey);
}

export function getEmailFrom(): string {
  return env.emailFrom;
}

/** Public base URL used to build links in emails (no trailing slash). */
export function getAppUrl(): string {
  return env.appUrl;
}

export function getEmailProvider(): EmailProvider {
  return env.resendApiKey ? createResendProvider(env.resendApiKey) : consoleProvider;
}
