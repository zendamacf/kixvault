import confetti from 'canvas-confetti';

export type CelebrationSize = 'small' | 'big';

const BASE_OPTIONS = {
  disableForReducedMotion: true,
  zIndex: 100,
} as const;

/** Shows confetti. It draws on its own canvas, so it stays after a route change. */
export function celebrate(size: CelebrationSize) {
  if (size === 'small') {
    void confetti({ ...BASE_OPTIONS, particleCount: 60, spread: 70, origin: { y: 0.7 } });
    return;
  }

  // Big: two bursts from the bottom corners, then a burst from the center.
  void confetti({
    ...BASE_OPTIONS,
    particleCount: 120,
    angle: 60,
    spread: 80,
    origin: { x: 0, y: 0.8 },
  });
  void confetti({
    ...BASE_OPTIONS,
    particleCount: 120,
    angle: 120,
    spread: 80,
    origin: { x: 1, y: 0.8 },
  });
  setTimeout(() => {
    void confetti({
      ...BASE_OPTIONS,
      particleCount: 200,
      spread: 120,
      startVelocity: 45,
      origin: { y: 0.6 },
    });
  }, 250);
}
