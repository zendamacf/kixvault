import { describe, expect, test } from 'bun:test';
import { type EmailTemplateProps, type EmailType, emailTemplates } from './index';
import { emailColors, escapeHtml } from './layout';

/** One sample per registered template. The type forces a sample when a template is added. */
const samples: { [K in EmailType]: EmailTemplateProps[K] } = {
  verifyEmail: { verifyUrl: 'https://kixvault.example/verify-email?token=abc', expiresInHours: 24 },
  resetPassword: {
    resetUrl: 'https://kixvault.example/reset-password?token=abc',
    expiresInMinutes: 60,
  },
};

describe('email templates', () => {
  for (const type of Object.keys(samples) as EmailType[]) {
    describe(type, () => {
      // The registry is keyed by type, so the render call cannot be typed per key in a loop.
      const render = emailTemplates[type] as (
        props: unknown,
      ) => ReturnType<(typeof emailTemplates)[EmailType]>;
      const email = render(samples[type]);

      test('has a subject, html and plain text body', () => {
        expect(email.subject).toContain('KixVault');
        expect(email.html.startsWith('<!doctype html>')).toBe(true);
        expect(email.text.length).toBeGreaterThan(0);
      });

      test('uses the KixVault brand shell', () => {
        expect(email.html).toContain(emailColors.brand);
        expect(email.html).toContain(emailColors.chrome);
        expect(email.html).toContain('Bricolage Grotesque');
        expect(email.html).toContain('prefers-color-scheme: dark');
        expect(email.html).toContain('KixVault');
      });
    });
  }

  test('verifyEmail puts the link in html and text, escaped in html', () => {
    const verifyUrl = 'https://kixvault.example/verify-email?token=a&b="x"';
    const email = emailTemplates.verifyEmail({ verifyUrl, expiresInHours: 24 });

    expect(email.html).toContain(escapeHtml(verifyUrl));
    expect(email.html).not.toContain(verifyUrl);
    expect(email.text).toContain(verifyUrl);
    expect(email.text).toContain('24 hours');
  });
});

describe('email localization', () => {
  test('sets the document language and defaults to English', () => {
    const email = emailTemplates.verifyEmail({
      verifyUrl: 'https://kixvault.example/v',
      expiresInHours: 24,
    });
    expect(email.html).toContain('<html lang="en">');
  });

  test('falls back to English for unsupported locales', () => {
    const props = { verifyUrl: 'https://kixvault.example/v', expiresInHours: 24 };
    expect(emailTemplates.verifyEmail({ ...props, locale: 'xx' })).toEqual(
      emailTemplates.verifyEmail(props),
    );
  });

  test('pluralizes expiry times', () => {
    const one = emailTemplates.resetPassword({
      resetUrl: 'https://kixvault.example/r',
      expiresInMinutes: 1,
    });
    expect(one.text).toContain('expires in 1 minute and');
    expect(one.text).not.toContain('1 minutes');
  });

  test('uses US English spelling', () => {
    const email = emailTemplates.resetPassword({
      resetUrl: 'https://kixvault.example/r',
      expiresInMinutes: 60,
    });
    expect(email.html).not.toMatch(/colour|favour|behaviour/i);
  });
});

describe('escapeHtml', () => {
  test('escapes markup characters', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;',
    );
  });
});
