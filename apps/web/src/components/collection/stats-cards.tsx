import { DollarSign, Footprints, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';

type StatsCardsProps = {
  count?: number;
  totalSpend?: number;
  avgSpend?: number;
  isLoading?: boolean;
};

export function StatsCards({
  count = 0,
  totalSpend = 0,
  avgSpend = 0,
  isLoading,
}: StatsCardsProps) {
  const items = [
    {
      label: 'Total pairs',
      value: String(count),
      icon: Footprints,
    },
    {
      label: 'Total spend',
      value: formatCurrency(totalSpend),
      icon: DollarSign,
    },
    {
      label: 'Avg per pair',
      value: formatCurrency(avgSpend),
      icon: TrendingUp,
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              <p className="text-3xl font-semibold tracking-tight">{item.value}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
