import type { SneakerCondition, VariantPrice } from '@kixvault/shared';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const disclaimer = condition ? getMarketValueDisclaimer(condition) : null;

  if (price == null) {
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>
        {t('marketValue.unavailable')}
      </p>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      <p className="text-sm">
        <span className="text-muted-foreground">{t('marketValue.value')} </span>
        <span className="font-medium text-foreground">{formatCurrency(price)}</span>
      </p>
      {gainLoss != null ? (
        <p
          className={cn(
            'text-sm font-medium',
            gainLoss > 0 && 'text-gain',
            gainLoss < 0 && 'text-loss',
            gainLoss === 0 && 'text-muted-foreground',
          )}
        >
          {t('marketValue.vsPaid', { amount: formatGainLoss(gainLoss) })}
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
  const { t } = useTranslation();

  if (size == null || Number.isNaN(size)) {
    return <p className="text-sm text-muted-foreground">{t('marketValue.enterSize')}</p>;
  }

  const matched = matchVariantPrice(size, variantPrices);

  if (!matched) {
    return <p className="text-sm text-muted-foreground">{t('marketValue.noPrice', { size })}</p>;
  }

  const gainLoss =
    purchasePrice != null && !Number.isNaN(purchasePrice) ? matched.price - purchasePrice : null;

  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
      <p className="font-heading font-semibold">{t('marketValue.preview')}</p>
      <MarketValue
        price={matched.price}
        gainLoss={gainLoss}
        condition={condition}
        className="mt-2"
      />
    </div>
  );
}
