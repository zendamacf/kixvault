import type { BrandBreakdownEntry } from '@kixvault/shared';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

/** Pairs owned per brand. */
export function BrandChart({ data }: { data: BrandBreakdownEntry[] }) {
  const { t } = useTranslation();
  const chartConfig = {
    count: { label: t('charts.pairs'), color: 'var(--chart-3)' },
  } satisfies ChartConfig;

  return (
    <ChartContainer
      config={chartConfig}
      className="w-full"
      style={{ height: Math.max(data.length * 40 + 24, 120) }}
      role="img"
      aria-label={t('charts.pairsPerBrand')}
    >
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="label"
          width={96}
          tickLine={false}
          axisLine={false}
          interval={0}
        />
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={4} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  );
}
