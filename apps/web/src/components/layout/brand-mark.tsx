import { cn } from '@/lib/utils';

type BrandMarkProps = {
  className?: string;
};

/**
 * KixVault app mark: a low-top sneaker on a box-orange tile. Matches public/favicon.svg.
 * Hovering a parent `group` lights the eyelets in sequence. Only colors animate, so edges
 * never get resampled the way they do with rotate/scale.
 */
export function BrandMark({ className }: BrandMarkProps) {
  const eyelet =
    'fill-primary transition-colors duration-200 motion-reduce:transition-none group-hover:fill-[#F9F9F7]';

  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      shapeRendering="geometricPrecision"
      className={cn('size-8 shrink-0', className)}
    >
      <rect
        width="64"
        height="64"
        rx="14"
        className="fill-primary transition-colors duration-200 motion-reduce:transition-none group-hover:fill-brand-hover"
      />
      <path
        d="M10 40v-8c0-2 1-3 3-3.5l8-2 5-9c1-2 3-2.5 5-1.5l4 3c4 4 9 7 15 8 4 1 5 3 5 6v7z"
        className="fill-primary-foreground"
      />
      <rect x="8" y="41" width="48" height="6" rx="3" fill="#F9F9F7" />
      <circle cx="28" cy="26" r="1.4" className={eyelet} />
      <circle cx="33" cy="29" r="1.4" className={cn(eyelet, 'delay-75')} />
      <circle cx="38" cy="32" r="1.4" className={cn(eyelet, 'delay-150')} />
    </svg>
  );
}
