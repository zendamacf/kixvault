import type { WearsByMonthPoint } from '@kixvault/shared';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { formatMonth } from '@/lib/analytics';

const chartConfig = {
  count: { label: 'Wears', color: 'var(--chart-2)' },
} satisfies ChartConfig;

/** Wears per month over the last year. */
export function WearsChart({ data }: { data: WearsByMonthPoint[] }) {
  return (
    <ChartContainer
      config={chartConfig}
      className="h-56 w-full"
      role="img"
      aria-label="Wears per month"
    >
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value: string) => formatMonth(value, 'short')}
        />
        <YAxis width={32} tickLine={false} axisLine={false} allowDecimals={false} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => formatMonth(payload[0]?.payload?.month, 'long')}
            />
          }
        />
        <Bar dataKey="count" fill="var(--color-count)" radius={4} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  );
}
