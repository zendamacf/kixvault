import { SNEAKER_SOLE, SNEAKER_UPPER_PATH } from '@/components/layout/sneaker-art';
import { cn } from '@/lib/utils';

type ShoeSilhouetteProps = {
  className?: string;
};

/**
 * Flat low-top sneaker profile in the current text color, for muted placeholders such as empty
 * states. Shape lives in sneaker-art.ts, which public/favicon.svg mirrors.
 */
export function ShoeSilhouette({ className }: ShoeSilhouetteProps) {
  return (
    <svg
      viewBox="6 14 52 36"
      aria-hidden="true"
      focusable="false"
      className={cn('fill-current', className)}
    >
      <path d={SNEAKER_UPPER_PATH} />
      <rect {...SNEAKER_SOLE} opacity="0.35" />
    </svg>
  );
}
