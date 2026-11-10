import { APP_NAME } from '@kixvault/shared';
import {
  SNEAKER_PAIR_BACK_PATH,
  SNEAKER_PAIR_FRONT_PATH,
  SNEAKER_PAIR_TRANSFORM,
} from '@/components/layout/sneaker-pair-art';
import { cn } from '@/lib/utils';

type BrandLockupProps = {
  className?: string;
};

/**
 * Full KixVault logo: the sneaker pair plus the wordmark. Meant for dark chrome surfaces (the
 * auth panel). Colours come from the theme tokens, so it follows the colorway: the sneakers and
 * "Kix" use primary, "Vault" uses chrome-foreground.
 */
export function BrandLockup({ className }: BrandLockupProps) {
  return (
    <svg
      viewBox="0 0 560 144"
      role="img"
      aria-label={APP_NAME}
      shapeRendering="geometricPrecision"
      className={cn('shrink-0', className)}
    >
      {/* Crop to the artwork's 780 x 616 bounds and scale it to the 144 tall lockup. */}
      <g transform="scale(0.2338) translate(-128 -212)" className="fill-primary">
        <g transform={SNEAKER_PAIR_TRANSFORM}>
          <path d={SNEAKER_PAIR_BACK_PATH} />
          <path d={SNEAKER_PAIR_FRONT_PATH} />
        </g>
      </g>
      <text
        x="196"
        y="94"
        className="font-heading"
        fontSize={68}
        fontWeight={800}
        letterSpacing={-3.8}
      >
        <tspan className="fill-primary">Kix</tspan>
        <tspan className="fill-chrome-foreground">Vault</tspan>
      </text>
    </svg>
  );
}
