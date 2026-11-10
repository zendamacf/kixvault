import type { PriceSnapshotEntry } from '@kixvault/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { sortSnapshotsAscending } from '@/lib/pricing';
import { formatCurrency, formatDate } from '@/lib/utils';

type PriceHistoryChartProps = {
  history: PriceSnapshotEntry[];
  /** Optional purchase price drawn as a dashed reference line. */
  purchasePrice?: number | null;
};

type PurchasePriceLineProps = {
  x1?: number;
  x2?: number;
  y1?: number;
  y2?: number;
  purchasePrice: number;
};

/** Dashed purchase price line that shows a "paid" tooltip when hovered or focused. */
export function PurchasePriceLine({
  x1 = 0,
  x2 = 0,
  y1 = 0,
  y2 = 0,
  purchasePrice,
}: PurchasePriceLineProps) {
  const { t } = useTranslation();
  const [active, setActive] = useState(false);
  const label = t('priceHistory.paid', { value: formatCurrency(purchasePrice) });

  return (
    <g>
      <line
        x1={x1}
        x2={x2}
        y1={y1}
        y2={y2}
        stroke="var(--muted-foreground)"
        strokeDasharray="4 4"
        strokeWidth={active ? 2 : 1}
      />
      {/* Wide transparent stroke so the thin line is easy to hover. */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: purely visual hover target; the purchase price is also shown in the page details */}
      <line
        data-testid="purchase-price-line"
        x1={x1}
        x2={x2}
        y1={y1}
        y2={y2}
        stroke="transparent"
        strokeWidth={14}
        className="cursor-help"
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => setActive(false)}
      />
      {active ? (
        <foreignObject
          x={Math.max(x1, x2 - 96)}
          y={y1 - 34}
          width={96}
          height={28}
          className="pointer-events-none overflow-visible"
        >
          <div className="w-fit rounded-lg border border-border/50 bg-background px-2.5 py-1 text-xs font-medium tabular-nums shadow-xl">
            {label}
          </div>
        </foreignObject>
      ) : null}
    </g>
  );
}

/** Line chart of market price snapshots over time. */
export function PriceHistoryChart({ history, purchasePrice }: PriceHistoryChartProps) {
  const { t } = useTranslation();
  if (history.length === 0) {
    return null;
  }

  const data = sortSnapshotsAscending(history);
  const chartConfig = {
    price: { label: t('priceHistory.marketPrice'), color: 'var(--chart-1)' },
  } satisfies ChartConfig;

  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
      <ChartContainer
        config={chartConfig}
        className="h-56 w-full"
        role="img"
        aria-label={t('priceHistory.chartLabel')}
      >
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="snapshotDate"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
            tickFormatter={(value: string) => formatDate(value)}
          />
          <YAxis
            width={56}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
            tickFormatter={(value: number) => formatCurrency(value)}
          />
          {purchasePrice != null ? (
            <ReferenceLine
              y={purchasePrice}
              ifOverflow="extendDomain"
              shape={(props: Omit<PurchasePriceLineProps, 'purchasePrice'>) => (
                <PurchasePriceLine {...props} purchasePrice={purchasePrice} />
              )}
            />
          ) : null}
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => formatDate(payload[0]?.payload?.snapshotDate)}
                formatter={(value) => formatCurrency(Number(value))}
              />
            }
          />
          <Line
            dataKey="price"
            type="monotone"
            stroke="var(--color-price)"
            strokeWidth={2}
            dot={data.length < 4}
            isAnimationActive={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
