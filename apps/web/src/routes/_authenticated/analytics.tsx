import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { BrandChart } from '@/components/analytics/brand-chart';
import { ChartCard } from '@/components/analytics/chart-card';
import { ConditionChart } from '@/components/analytics/condition-chart';
import { MostWornList } from '@/components/analytics/most-worn-list';
import { PortfolioValueChart } from '@/components/analytics/portfolio-value-chart';
import { WearsChart } from '@/components/analytics/wears-chart';
import { Skeleton } from '@/components/ui/skeleton';
import { analyticsQueryOptions } from '@/lib/queries';

export const Route = createFileRoute('/_authenticated/analytics')({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { data, isLoading, error } = useQuery(analyticsQueryOptions);
  const analytics = data?.analytics;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-4xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">How your collection is worth, worn, and made up.</p>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error.message}
        </p>
      ) : null}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-80 w-full rounded-2xl lg:col-span-2" />
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      ) : null}

      {analytics ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="min-w-0 lg:col-span-2">
            <ChartCard
              title="Collection value"
              description="Combined market value of your pairs, week by week."
              emptyMessage="Value history appears once market prices are recorded for your pairs."
              isEmpty={analytics.portfolioValue.length === 0}
              footnote={
                analytics.trackedPairs < analytics.totalPairs
                  ? `Based on ${analytics.trackedPairs} of ${analytics.totalPairs} pairs. Pairs without catalog pricing are left out.`
                  : undefined
              }
            >
              <PortfolioValueChart data={analytics.portfolioValue} />
            </ChartCard>
          </div>

          <ChartCard
            title="Wears per month"
            description="The last 12 months."
            emptyMessage="Log a wear to start tracking."
            isEmpty={analytics.wearsByMonth.every((point) => point.count === 0)}
          >
            <WearsChart data={analytics.wearsByMonth} />
          </ChartCard>

          <ChartCard
            title="Most worn"
            description="Your top pairs of all time."
            emptyMessage="No wears logged yet."
            isEmpty={analytics.mostWorn.length === 0}
          >
            <MostWornList entries={analytics.mostWorn} />
          </ChartCard>

          <ChartCard
            title="By brand"
            description="Pairs per brand."
            emptyMessage="Add sneakers to see your brands."
            isEmpty={analytics.brands.length === 0}
          >
            <BrandChart data={analytics.brands} />
          </ChartCard>

          <ChartCard
            title="By condition"
            description="How worn your pairs are."
            emptyMessage="Add sneakers to see their condition."
            isEmpty={analytics.conditions.length === 0}
          >
            <ConditionChart data={analytics.conditions} />
          </ChartCard>
        </div>
      ) : null}
    </div>
  );
}
