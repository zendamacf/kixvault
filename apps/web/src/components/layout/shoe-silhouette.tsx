import { SNEAKER_SOLE, SNEAKER_UPPER_PATH } from '@/components/layout/sneaker-art';
import { cn } from '@/lib/utils';

type ShoeSilhouetteProps = {
  className?: string;
  /** Adds laces and a panel line, for large uses. Lines are drawn in the chrome (ink) color. */
  detail?: boolean;
};

/** Low-top sneaker profile in the current text color. Same drawing as BrandMark (see sneaker-art.ts). */
export function ShoeSilhouette({ className, detail = false }: ShoeSilhouetteProps) {
  return (
    <svg
      viewBox="6 14 52 36"
      aria-hidden="true"
      focusable="false"
      className={cn('fill-current', className)}
    >
      <path d={SNEAKER_UPPER_PATH} />
      <rect {...SNEAKER_SOLE} opacity="0.35" />
      {detail ? (
        <g
          fill="none"
          strokeWidth="1.1"
          strokeLinecap="round"
          className="stroke-chrome"
          opacity="0.9"
        >
          <path d="M27.5 22.2l3.6-2.6M30.6 25l4.4-3.2M34 28l5-3.6M38 30.8l5.2-3.6" />
          <path d="M13.5 35.5c7-3.4 17-3.4 27.5-1" />
        </g>
      ) : null}
    </svg>
  );
}
