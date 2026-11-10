import { type VerifyEmailProps, verifyEmailTemplate } from './verify-email';

export type RenderedEmail = { subject: string; html: string; text: string };

/**
 * Registry of email types. To add an email:
 * 1. Create `templates/<name>.ts` that exports a props type and a function returning
 *    `RenderedEmail`. Build the HTML with `renderLayout` and the helpers in `layout.ts`,
 *    so every email keeps the KixVault branding.
 * 2. Add the props type to `EmailTemplateProps` and the function to `emailTemplates` below.
 * 3. Send it with `sendEmail('<name>', to, props)`.
 * `templates.unit.test.ts` renders every registered template, so a new one gets branding
 * checks once you add sample props there.
 */
export type EmailTemplateProps = {
  verifyEmail: VerifyEmailProps;
};

export type EmailType = keyof EmailTemplateProps;

export const emailTemplates: {
  [K in EmailType]: (props: EmailTemplateProps[K]) => RenderedEmail;
} = {
  verifyEmail: verifyEmailTemplate,
};
