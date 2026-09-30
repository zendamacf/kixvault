import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const nginxConfig = readFileSync(path.join(import.meta.dir, 'nginx.conf'), 'utf8');

describe('nginx.conf security headers', () => {
  test('sets standard security headers on all responses', () => {
    expect(nginxConfig).toContain('X-Content-Type-Options "nosniff"');
    expect(nginxConfig).toContain('Referrer-Policy "strict-origin-when-cross-origin"');
    expect(nginxConfig).toContain('X-Frame-Options "SAMEORIGIN"');
    expect(nginxConfig).toContain('Permissions-Policy');
    expect(nginxConfig).toContain('Content-Security-Policy');
    expect(nginxConfig).toContain("connect-src 'self' https://*.ingest.de.sentry.io");
  });
});
