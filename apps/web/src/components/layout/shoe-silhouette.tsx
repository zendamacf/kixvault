import { cn } from '@/lib/utils';

type ShoeSilhouetteProps = {
  className?: string;
  /** Adds laces and a panel line, for large uses. Lines are drawn in the chrome (ink) color. */
  detail?: boolean;
};

/** Low-top sneaker profile in the current text color. Same drawing as BrandMark. */
export function ShoeSilhouette({ className, detail = false }: ShoeSilhouetteProps) {
  return (
    <svg
      viewBox="6 14 52 36"
      aria-hidden="true"
      focusable="false"
      className={cn('fill-current', className)}
    >
      <path d="M10 40v-8c0-2 1-3 3-3.5l8-2 5-9c1-2 3-2.5 5-1.5l4 3c4 4 9 7 15 8 4 1 5 3 5 6v7z" />
      <rect x="8" y="41" width="48" height="6" rx="3" opacity="0.35" />
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
