import {
  SNEAKER_EYELET_RADIUS,
  SNEAKER_EYELETS,
  SNEAKER_SOLE,
  SNEAKER_SOLE_COLOR,
  SNEAKER_UPPER_PATH,
} from '@/components/layout/sneaker-art';
import { cn } from '@/lib/utils';

type BrandMarkProps = {
  className?: string;
  /**
   * Draw just the shoe, with no tile behind it: an orange upper, off-white sole, and eyelets
   * that show the surface through (the chrome colour, so use it on `bg-chrome`).
   */
  bare?: boolean;
};

/**
 * KixVault app mark: a low-top sneaker on a box-orange tile. Drawing lives in sneaker-art.ts
 * and is mirrored by public/favicon.svg.
 * Hovering a parent `group` lights the eyelets in sequence. Only colors animate, so edges
 * never get resampled the way they do with rotate/scale.
 */
export function BrandMark({ className, bare = false }: BrandMarkProps) {
  const eyelet = bare
    ? 'fill-chrome'
    : 'fill-primary transition-colors duration-200 motion-reduce:transition-none group-hover:fill-[#F9F9F7]';

  return (
    <svg
      viewBox={bare ? '6 14 52 36' : '0 0 64 64'}
      aria-hidden="true"
      shapeRendering="geometricPrecision"
      className={cn(!bare && 'size-8', 'shrink-0', className)}
    >
      {bare ? null : (
        <rect
          width="64"
          height="64"
          rx="14"
          className="fill-primary transition-colors duration-200 motion-reduce:transition-none group-hover:fill-brand-hover"
        />
      )}
      <path d={SNEAKER_UPPER_PATH} className={bare ? 'fill-primary' : 'fill-primary-foreground'} />
      <rect {...SNEAKER_SOLE} fill={SNEAKER_SOLE_COLOR} />
      {SNEAKER_EYELETS.map((spot, index) => (
        <circle
          key={spot.cx}
          {...spot}
          r={SNEAKER_EYELET_RADIUS}
          className={cn(
            eyelet,
            !bare && index === 1 && 'delay-75',
            !bare && index === 2 && 'delay-150',
          )}
        />
      ))}
    </svg>
  );
}
