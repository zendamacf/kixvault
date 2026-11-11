import type { DepartureType } from '@kixvault/shared';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/collection/empty-state';
import { HistoryRow } from '@/components/history/history-row';
import { HistorySummary } from '@/components/history/history-summary';
import { Skeleton } from '@/components/ui/skeleton';
import { departureTypes, formatDepartureType } from '@/lib/departure';
import { type Sneaker, sneakersQueryOptions } from '@/lib/queries';
import { useRestoreSneaker } from '@/lib/retire-actions';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_authenticated/history')({
  component: HistoryPage,
});

type TypeFilter = DepartureType | '';

const retiredFilters = { status: 'retired', sort: 'departed_on', order: 'desc' } as const;

function HistoryPage() {
  const { t } = useTranslation();
  const [type, setType] = useState<TypeFilter>('');
  const { data, isLoading, error } = useQuery(sneakersQueryOptions(retiredFilters));
  const restore = useRestoreSneaker();

  const retired = (data?.sneakers ?? []) as Sneaker[];
  const visible = type ? retired.filter((sneaker) => sneaker.departureType === type) : retired;

  // Only offer the types that exist in the history, so no chip leads to an empty list.
  const presentTypes = useMemo(
    () =>
      departureTypes.filter((value) => retired.some((sneaker) => sneaker.departureType === value)),
    [retired],
  );
  const chips: { value: TypeFilter; label: string }[] = [
    { value: '', label: t('history.allTypes') },
    ...presentTypes.map((value) => ({ value, label: formatDepartureType(value) })),
  ];

  const isEmpty = !isLoading && !error && retired.length === 0;
  const restoringId = restore.isPending ? restore.variables?.sneakerId : undefined;

  return (
    <div className="space-y-10">
      <h1 className="sr-only">{t('history.pageTitle')}</h1>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-9 w-full max-w-xl" />
          <Skeleton className="h-9 w-2/3 max-w-sm" />
        </div>
      ) : null}

      {!isLoading && !error && retired.length > 0 ? <HistorySummary sneakers={retired} /> : null}

      {isEmpty ? (
        <p className="max-w-xl text-balance font-heading text-3xl leading-[1.15] tracking-tight text-muted-foreground sm:text-4xl">
          {t('history.tagline')}
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error.message}
        </p>
      ) : null}

      {isEmpty ? (
        <EmptyState
          title={t('history.empty.title')}
          description={t('history.empty.description')}
          actionLabel={t('history.empty.action')}
          actionTo="/"
        />
      ) : null}

      {retired.length > 0 ? (
        <section className="space-y-4" aria-label={t('history.listLabel')}>
          {presentTypes.length > 1 ? (
            <fieldset className="-mx-4 flex min-w-0 gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
              <legend className="sr-only">{t('history.filterLegend')}</legend>
              {chips.map((chip) => {
                const active = type === chip.value;

                return (
                  <button
                    key={chip.value || 'all'}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setType(chip.value)}
                    className={cn(
                      'h-9 shrink-0 rounded-full border px-3.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                      active
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-input bg-card text-foreground hover:bg-muted',
                    )}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </fieldset>
          ) : null}

          <p className="min-h-5 text-sm text-muted-foreground" aria-live="polite">
            {t('common.pairCount', { count: visible.length })}
          </p>

          {visible.length === 0 ? (
            <EmptyState
              title={t('history.noMatches.title')}
              description={t('history.noMatches.description')}
              onClearFilters={() => setType('')}
            />
          ) : (
            <ul className="divide-y divide-border rounded-2xl bg-card ring-1 ring-border">
              {visible.map((sneaker) => (
                <HistoryRow
                  key={sneaker.id}
                  sneaker={sneaker}
                  isRestoring={restoringId === sneaker.id}
                  onRestore={(row) =>
                    restore.mutate({ sneakerId: row.id, label: `${row.brand} ${row.model}` })
                  }
                />
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
