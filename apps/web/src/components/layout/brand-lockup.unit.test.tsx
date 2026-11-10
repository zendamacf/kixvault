import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, render } from '@testing-library/react';
import { BrandLockup } from './brand-lockup';

afterEach(() => {
  cleanup();
});

describe('BrandLockup', () => {
  test('is labelled as the app name and includes the wordmark', () => {
    const { container } = render(<BrandLockup />);

    expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe('KixVault');
    expect(container.querySelector('text')?.textContent).toBe('KixVault');
  });
});
