import type { PortfolioValuePoint } from '@kixvault/shared';
import { useTranslation } from 'react-i18next';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { formatCurrency, formatDate } from '@/lib/utils';

/** Total market value of the collection over time. */
export function PortfolioValueChart({ data }: { data: PortfolioValuePoint[] }) {
  const { t } = useTranslation();
  const chartConfig = {
    value: { label: t('charts.marketValue'), color: 'var(--chart-1)' },
  } satisfies ChartConfig;

  return (
    <ChartContainer
      config={chartConfig}
      className="h-64 w-full"
      role="img"
      aria-label={t('charts.valueOverTime')}
    >
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          tickFormatter={(value: string) => formatDate(value)}
        />
        <YAxis
          width={64}
          tickLine={false}
          axisLine={false}
          domain={['auto', 'auto']}
          tickFormatter={(value: number) => formatCurrency(value)}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => formatDate(payload[0]?.payload?.date)}
              formatter={(value, _name, item) => (
                <span className="flex w-full items-center justify-between gap-4">
                  <span className="text-muted-foreground">
                    {t('common.pairCount', { count: item.payload.pairs })}
                  </span>
                  <span className="font-medium tabular-nums">{formatCurrency(Number(value))}</span>
                </span>
              )}
            />
          }
        />
        <Area
          dataKey="value"
          type="monotone"
          stroke="var(--color-value)"
          fill="var(--color-value)"
          fillOpacity={0.15}
          strokeWidth={2}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
