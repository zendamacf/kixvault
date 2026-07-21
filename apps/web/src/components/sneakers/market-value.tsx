import type { SneakerCondition, VariantPrice } from '@kixvault/shared';
import { getMarketValueDisclaimer, matchVariantPrice } from '@/lib/pricing';
import { cn, formatCurrency, formatGainLoss } from '@/lib/utils';

type MarketValueProps = {
  price: number | null;
  gainLoss?: number | null;
  condition?: SneakerCondition | string;
  className?: string;
  showUnavailable?: boolean;
};

/** Displays market value and optional gain/loss for a sneaker. */
export function MarketValue({ price, gainLoss, condition, className }: MarketValueProps) {
  const disclaimer = condition ? getMarketValueDisclaimer(condition) : null;

  if (price == null) {
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>Market value unavailable</p>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      <p className="text-sm">
        <span className="text-muted-foreground">Value </span>
        <span className="font-medium text-foreground">{formatCurrency(price)}</span>
      </p>
      {gainLoss != null ? (
        <p
          className={cn(
            'text-sm font-medium',
            gainLoss > 0 && 'text-emerald-600 dark:text-emerald-400',
            gainLoss < 0 && 'text-destructive',
            gainLoss === 0 && 'text-muted-foreground',
          )}
        >
          {formatGainLoss(gainLoss)} vs paid
        </p>
      ) : null}
      {disclaimer ? <p className="text-xs text-muted-foreground">{disclaimer}</p> : null}
    </div>
  );
}

type CatalogMarketPricePreviewProps = {
  size?: number;
  condition: SneakerCondition | string;
  variantPrices: VariantPrice[];
  purchasePrice?: number | null;
};

/** Live market price preview while adding a catalog sneaker. */
export function CatalogMarketPricePreview({
  size,
  condition,
  variantPrices,
  purchasePrice,
}: CatalogMarketPricePreviewProps) {
  if (size == null || Number.isNaN(size)) {
    return (
      <p className="text-sm text-muted-foreground">
        Enter a size to preview the current market value.
      </p>
    );
  }

  const matched = matchVariantPrice(size, variantPrices);

  if (!matched) {
    return (
      <p className="text-sm text-muted-foreground">No market price available for size {size}.</p>
    );
  }

  const gainLoss =
    purchasePrice != null && !Number.isNaN(purchasePrice) ? matched.price - purchasePrice : null;

  return (
    <div className="rounded-lg border border-dashed bg-background/60 p-4">
      <p className="text-sm font-medium">Market preview</p>
      <MarketValue
        price={matched.price}
        gainLoss={gainLoss}
        condition={condition}
        className="mt-2"
      />
    </div>
  );
}
