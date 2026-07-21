import { DollarSign, Footprints, LineChart, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatCurrency, formatGainLoss } from '@/lib/utils';

type StatsCardsProps = {
  count?: number;
  totalSpend?: number;
  avgSpend?: number;
  totalMarketValue?: number | null;
  totalGainLoss?: number | null;
  isLoading?: boolean;
};

/** Summary cards for pair count, spend, and market value. */
export function StatsCards({
  count = 0,
  totalSpend = 0,
  avgSpend = 0,
  totalMarketValue = null,
  totalGainLoss = null,
  isLoading,
}: StatsCardsProps) {
  const items = [
    {
      label: 'Total pairs',
      value: String(count),
      icon: Footprints,
      valueClassName: undefined,
    },
    {
      label: 'Total spend',
      value: formatCurrency(totalSpend),
      icon: DollarSign,
      valueClassName: undefined,
    },
    {
      label: 'Avg per pair',
      value: formatCurrency(avgSpend),
      icon: TrendingUp,
      valueClassName: undefined,
    },
    {
      label: 'Market value',
      value: formatCurrency(totalMarketValue),
      icon: LineChart,
      valueClassName: undefined,
    },
    {
      label: 'Gain / loss',
      value: formatGainLoss(totalGainLoss),
      icon: LineChart,
      valueClassName:
        totalGainLoss != null
          ? totalGainLoss > 0
            ? 'text-emerald-600 dark:text-emerald-400'
            : totalGainLoss < 0
              ? 'text-destructive'
              : undefined
          : undefined,
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.label}
            </CardTitle>
            <item.icon className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <p className={cn('text-3xl font-semibold tracking-tight', item.valueClassName)}>
                {item.value}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
