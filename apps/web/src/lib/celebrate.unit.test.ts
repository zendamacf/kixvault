import { beforeEach, describe, expect, mock, test } from 'bun:test';

const confettiMock = mock((_options?: unknown) => Promise.resolve(null));

mock.module('canvas-confetti', () => ({ default: confettiMock }));

const { celebrate } = await import('./celebrate');

beforeEach(() => {
  confettiMock.mockClear();
});

describe('celebrate', () => {
  test('small fires one burst', () => {
    celebrate('small');

    expect(confettiMock).toHaveBeenCalledTimes(1);
  });

  test('big fires more particles than small', async () => {
    celebrate('small');
    const small = (confettiMock.mock.calls as Array<[{ particleCount: number }]>).reduce(
      (sum, [options]) => sum + options.particleCount,
      0,
    );

    confettiMock.mockClear();
    celebrate('big');
    await new Promise((resolve) => setTimeout(resolve, 300));
    const big = (confettiMock.mock.calls as Array<[{ particleCount: number }]>).reduce(
      (sum, [options]) => sum + options.particleCount,
      0,
    );

    expect(confettiMock).toHaveBeenCalledTimes(3);
    expect(big).toBeGreaterThan(small);
  });

  test('respects reduced motion', () => {
    celebrate('small');

    const [options] = confettiMock.mock.calls[0] as [{ disableForReducedMotion: boolean }];
    expect(options.disableForReducedMotion).toBe(true);
  });
});
