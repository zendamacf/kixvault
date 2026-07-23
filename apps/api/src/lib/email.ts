import { APP_NAME } from '@kixvault/shared';
import { Resend } from 'resend';
import { env } from './env';

function getResendClient(): Resend | null {
  if (!env.resendApiKey) {
    return null;
  }

  return new Resend(env.resendApiKey);
}

export async function sendVerificationEmail({
  to,
  token,
}: {
  to: string;
  token: string;
}): Promise<void> {
  const verificationUrl = `${env.appUrl}/verify-email?token=${encodeURIComponent(token)}`;

  if (!env.resendApiKey) {
    if (!env.isProduction) {
      console.info(`[dev] Verification link for ${to}: ${verificationUrl}`);
      return;
    }

    throw new Error('RESEND_API_KEY is required to send verification emails');
  }

  const resend = getResendClient();
  if (!resend) {
    throw new Error('Failed to initialize Resend client');
  }

  const { error } = await resend.emails.send({
    from: env.emailFrom,
    to,
    subject: `Verify your ${APP_NAME} account`,
    html: `
      <p>Thanks for signing up for ${APP_NAME}.</p>
      <p><a href="${verificationUrl}">Verify your email address</a></p>
      <p>This link expires in 48 hours. If you did not create an account, you can ignore this email.</p>
    `,
    text: `Thanks for signing up for ${APP_NAME}.\n\nVerify your email: ${verificationUrl}\n\nThis link expires in 48 hours.`,
  });

  if (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}
