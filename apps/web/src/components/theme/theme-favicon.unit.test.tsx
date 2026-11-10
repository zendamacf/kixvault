import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { cleanup, render, waitFor } from '@testing-library/react';
import { SNEAKER_PAIR_BACK_PATH, SNEAKER_PAIR_FRONT_PATH } from '../layout/sneaker-pair-art';
import { buildFaviconSvg, ThemeFavicon } from './theme-favicon';

let link: HTMLLinkElement;

beforeEach(() => {
  link = document.createElement('link');
  link.rel = 'icon';
  link.href = '/favicon.svg';
  document.head.append(link);
});

afterEach(() => {
  cleanup();
  link.remove();
  document.documentElement.removeAttribute('style');
  document.documentElement.removeAttribute('data-theme');
});

const currentSvg = () => decodeURIComponent(link.href.replace('data:image/svg+xml,', ''));

describe('buildFaviconSvg', () => {
  test('draws the sneaker pair in the given colour with no background', () => {
    const svg = buildFaviconSvg('hsl(222 90% 62%)');

    expect(svg).toContain('fill="hsl(222 90% 62%)"');
    expect(svg).toContain(`d="${SNEAKER_PAIR_BACK_PATH}"`);
    expect(svg).toContain(`d="${SNEAKER_PAIR_FRONT_PATH}"`);
    expect(svg).not.toContain('<rect');
  });
});

describe('ThemeFavicon', () => {
  test('colours the icon from the active theme and follows theme changes', async () => {
    document.documentElement.style.setProperty('--brand', 'hsl(16 100% 58%)');
    render(<ThemeFavicon />);

    expect(currentSvg()).toContain('fill="hsl(16 100% 58%)"');

    document.documentElement.style.setProperty('--brand', 'hsl(222 90% 62%)');
    document.documentElement.setAttribute('data-theme', 'royal');

    await waitFor(() => expect(currentSvg()).toContain('fill="hsl(222 90% 62%)"'));
  });

  test('leaves the static icon alone when the theme has no brand colour', () => {
    render(<ThemeFavicon />);

    expect(link.getAttribute('href')).toBe('/favicon.svg');
  });
});
