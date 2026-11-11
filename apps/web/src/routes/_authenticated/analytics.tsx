import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { BrandChart } from '@/components/analytics/brand-chart';
import { ChartCard } from '@/components/analytics/chart-card';
import { ConditionChart } from '@/components/analytics/condition-chart';
import { CostPerWearCard } from '@/components/analytics/cost-per-wear-card';
import { MostWornList } from '@/components/analytics/most-worn-list';
import { PortfolioValueChart } from '@/components/analytics/portfolio-value-chart';
import { RealizedGains } from '@/components/analytics/realized-gains';
import { WearsChart } from '@/components/analytics/wears-chart';
import { Skeleton } from '@/components/ui/skeleton';
import { analyticsQueryOptions } from '@/lib/queries';

export const Route = createFileRoute('/_authenticated/analytics')({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { t } = useTranslation();
  const { data, isLoading, error } = useQuery(analyticsQueryOptions);
  const analytics = data?.analytics;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-4xl font-semibold tracking-tight">
          {t('analytics.title')}
        </h1>
        <p className="text-muted-foreground">{t('analytics.description')}</p>
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
              title={t('analytics.value.title')}
              description={t('analytics.value.description')}
              emptyMessage={t('analytics.value.empty')}
              isEmpty={analytics.portfolioValue.length === 0}
              footnote={
                analytics.trackedPairs < analytics.totalPairs
                  ? t('analytics.value.footnote', {
                      tracked: analytics.trackedPairs,
                      total: analytics.totalPairs,
                    })
                  : undefined
              }
            >
              <PortfolioValueChart data={analytics.portfolioValue} />
            </ChartCard>
          </div>

          <div className="min-w-0 lg:col-span-2">
            <ChartCard
              title={t('analytics.realized.title')}
              description={t('analytics.realized.description')}
              emptyMessage={t('analytics.realized.empty')}
              isEmpty={analytics.realized.soldCount === 0}
            >
              <RealizedGains realized={analytics.realized} />
            </ChartCard>
          </div>

          <ChartCard
            title={t('analytics.wearsPerMonth.title')}
            description={t('analytics.wearsPerMonth.description')}
            emptyMessage={t('analytics.wearsPerMonth.empty')}
            isEmpty={analytics.wearsByMonth.every((point) => point.count === 0)}
          >
            <WearsChart data={analytics.wearsByMonth} />
          </ChartCard>

          <ChartCard
            title={t('analytics.mostWorn.title')}
            description={t('analytics.mostWorn.description')}
            emptyMessage={t('analytics.mostWorn.empty')}
            isEmpty={analytics.mostWorn.length === 0}
          >
            <MostWornList entries={analytics.mostWorn} />
          </ChartCard>

          <ChartCard
            title={t('analytics.costPerWear.title')}
            description={t('analytics.costPerWear.description')}
            emptyMessage={t('analytics.costPerWear.empty')}
            isEmpty={analytics.costPerWear.best.length === 0}
          >
            <CostPerWearCard summary={analytics.costPerWear} />
          </ChartCard>

          <ChartCard
            title={t('analytics.byBrand.title')}
            description={t('analytics.byBrand.description')}
            emptyMessage={t('analytics.byBrand.empty')}
            isEmpty={analytics.brands.length === 0}
          >
            <BrandChart data={analytics.brands} />
          </ChartCard>

          <ChartCard
            title={t('analytics.byCondition.title')}
            description={t('analytics.byCondition.description')}
            emptyMessage={t('analytics.byCondition.empty')}
            isEmpty={analytics.conditions.length === 0}
          >
            <ConditionChart data={analytics.conditions} />
          </ChartCard>
        </div>
      ) : null}
    </div>
  );
}
