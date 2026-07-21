import type { sneakers as sneakersTable } from '@kixvault/db';
import { computeGainLoss, getMarketPriceForSneaker, type MarketPriceRecord } from './pricing';

type SneakerRow = typeof sneakersTable.$inferSelect;

const priceableConditions = new Set(['deadstock', 'lightly_worn']);

export type CollectionMarketStats = {
  totalMarketValue: number | null;
  totalGainLoss: number | null;
};

export function computeCollectionMarketStats(
  rows: SneakerRow[],
  prices: Map<string, MarketPriceRecord>,
): CollectionMarketStats {
  let totalMarketValue = 0;
  let totalGainLoss = 0;
  let hasMarketValue = false;
  let hasGainLoss = false;

  for (const row of rows) {
    if (!priceableConditions.has(row.condition)) {
      continue;
    }

    const marketPrice = getMarketPriceForSneaker(row, prices);

    if (!marketPrice) {
      continue;
    }

    hasMarketValue = true;
    totalMarketValue += marketPrice.price;

    const gainLoss = computeGainLoss(row.purchasePrice, marketPrice.price);

    if (gainLoss !== null) {
      hasGainLoss = true;
      totalGainLoss += gainLoss;
    }
  }

  return {
    totalMarketValue: hasMarketValue ? totalMarketValue : null,
    totalGainLoss: hasGainLoss ? totalGainLoss : null,
  };
}
