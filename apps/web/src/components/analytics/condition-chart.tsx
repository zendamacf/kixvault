import type { ConditionBreakdownEntry } from '@kixvault/shared';
import { Cell, Pie, PieChart } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { formatCondition } from '@/lib/utils';

const chartConfig = {
  deadstock: { label: 'Deadstock', color: 'var(--chart-1)' },
  lightly_worn: { label: 'Lightly worn', color: 'var(--chart-2)' },
  worn: { label: 'Worn', color: 'var(--chart-3)' },
  beat: { label: 'Beat', color: 'var(--chart-4)' },
} satisfies ChartConfig;

/** Share of pairs in each condition, with a legend that doubles as a text alternative. */
export function ConditionChart({ data }: { data: ConditionBreakdownEntry[] }) {
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
      <ChartContainer
        config={chartConfig}
        className="aspect-square h-48 shrink-0"
        role="img"
        aria-label="Pairs per condition"
      >
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="condition" />} />
          <Pie
            data={data}
            dataKey="count"
            nameKey="condition"
            innerRadius={48}
            strokeWidth={2}
            isAnimationActive={false}
          >
            {data.map((entry) => (
              <Cell key={entry.condition} fill={`var(--color-${entry.condition})`} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="w-full space-y-2 text-sm">
        {data.map((entry) => (
          <li key={entry.condition} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span
                className="size-3 rounded-sm"
                style={{ backgroundColor: chartConfig[entry.condition].color }}
                aria-hidden
              />
              {formatCondition(entry.condition)}
            </span>
            <span className="font-medium tabular-nums">{entry.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
