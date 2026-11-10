import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Footprints, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';
import { BackLink } from '@/components/layout/back-link';
import { PriceHistory } from '@/components/sneakers/price-history';
import { SneakerThumbnail } from '@/components/sneakers/sneaker-thumbnail';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { WearSuggestion } from '@/components/wears/wear-suggestion';
import { api, parseApiError } from '@/lib/api';
import { getMarketValueDisclaimer } from '@/lib/pricing';
import { sneakerPriceHistoryQueryOptions, sneakerQueryOptions } from '@/lib/queries';
import { trackUmamiEvent } from '@/lib/umami';
import { UmamiEvents } from '@/lib/umami-events';
import {
  cn,
  formatCondition,
  formatCurrency,
  formatDate,
  getCatalogSourceLabel,
} from '@/lib/utils';
import { useLogWear } from '@/lib/wear-actions';

/** Pages that link to a sneaker and want the back link to return to them. */
const backTargets = {
  analytics: { to: '/analytics', labelKey: 'common.backToAnalytics' },
  wears: { to: '/wears', labelKey: 'common.backToWears' },
  collection: { to: '/', labelKey: 'common.backToCollection' },
} as const;

export const Route = createFileRoute('/_authenticated/sneakers/$sneakerId/')({
  validateSearch: z.object({
    from: z.enum(['analytics', 'wears']).optional().catch(undefined),
  }),
  component: SneakerDetailPage,
});

function SneakerDetailPage() {
  const { t } = useTranslation();
  const { sneakerId } = Route.useParams();
  const { from } = Route.useSearch();
  const backTarget = backTargets[from ?? 'collection'];
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const { data, isLoading, error } = useQuery(sneakerQueryOptions(sneakerId));
  const logWear = useLogWear();
  const { data: priceHistoryData, isLoading: priceHistoryLoading } = useQuery({
    ...sneakerPriceHistoryQueryOptions(sneakerId),
    enabled: Boolean(data?.sneaker),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await api.api.sneakers[':id'].$delete({
        param: { id: sneakerId },
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response, t('errors.deleteSneaker')));
      }
    },
    onSuccess: async () => {
      trackUmamiEvent(UmamiEvents.sneakerDelete);
      await queryClient.invalidateQueries({ queryKey: ['sneakers'] });
      await queryClient.invalidateQueries({ queryKey: ['stats'] });
      await navigate({ to: '/' });
    },
    onError: (mutationError) => {
      setActionError(mutationError.message);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-5 w-40" />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12">
          <Skeleton className="aspect-[5/4] w-full rounded-3xl" />
          <div className="space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-56 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.sneaker) {
    return (
      <div className="space-y-4">
        <BackLink to={backTarget.to}>{t(backTarget.labelKey)}</BackLink>
        <p className="text-sm text-destructive" role="alert">
          {error?.message ?? t('sneakers.notFound')}
        </p>
      </div>
    );
  }

  const sneaker = data.sneaker;
  const title = `${sneaker.brand} ${sneaker.model}`;
  const catalogSourceLabel = getCatalogSourceLabel(sneaker.catalogSource);
  const hasMarketPrice = sneaker.currentMarketPrice != null;
  const disclaimer = getMarketValueDisclaimer(sneaker.condition);
  const gainLoss = sneaker.gainLoss;

  const facts: { label: string; value: string }[] = [
    { label: t('sneakers.detail.facts.size'), value: String(sneaker.size) },
    { label: t('sneakers.detail.facts.condition'), value: formatCondition(sneaker.condition) },
    {
      label: t('sneakers.detail.facts.worn'),
      value:
        sneaker.wearCount === 0
          ? t('sneakers.detail.neverWorn')
          : sneaker.lastWornOn
            ? t('sneakers.detail.wornTimesLast', {
                count: sneaker.wearCount,
                date: formatDate(sneaker.lastWornOn),
              })
            : t('sneakers.detail.wornTimes', { count: sneaker.wearCount }),
    },
    ...(sneaker.purchasePrice != null
      ? [{ label: t('sneakers.detail.facts.paid'), value: formatCurrency(sneaker.purchasePrice) }]
      : []),
    ...(sneaker.purchaseDate
      ? [
          {
            label: t('sneakers.detail.facts.purchased'),
            value: formatDate(sneaker.purchaseDate),
          },
        ]
      : []),
    ...(sneaker.releaseDate
      ? [{ label: t('sneakers.detail.facts.released'), value: formatDate(sneaker.releaseDate) }]
      : []),
    { label: t('sneakers.detail.facts.added'), value: formatDate(sneaker.createdAt) },
  ];

  return (
    <div className="space-y-10">
      <BackLink to={backTarget.to}>{t(backTarget.labelKey)}</BackLink>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12">
        <div className="self-start rounded-3xl bg-card ring-1 ring-border lg:sticky lg:top-20">
          <SneakerThumbnail
            imageUrl={sneaker.primaryImage?.url ?? null}
            alt={title}
            className="aspect-[5/4] w-full rounded-none p-8"
          />
        </div>

        <div className="min-w-0 space-y-8">
          <header className="space-y-3">
            <h1 className="font-heading text-4xl leading-[1.05] tracking-tight sm:text-5xl">
              <span className="font-normal text-muted-foreground">{sneaker.brand}</span>{' '}
              <span className="font-semibold">{sneaker.model}</span>
            </h1>
            <div className="space-y-0.5 text-lg">
              {sneaker.nickname ? <p>{`"${sneaker.nickname}"`}</p> : null}
              <p className="text-muted-foreground">
                {sneaker.colorway || t('sneakers.detail.noColorway')}
              </p>
            </div>
            {sneaker.sku || (sneaker.catalogUrl && catalogSourceLabel) ? (
              <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {sneaker.sku ? <span>{sneaker.sku}</span> : null}
                {sneaker.catalogUrl && catalogSourceLabel ? (
                  <a
                    href={sneaker.catalogUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground underline underline-offset-4 hover:decoration-primary hover:decoration-2"
                  >
                    {t('sneakers.detail.viewOn', { source: catalogSourceLabel })}
                  </a>
                ) : null}
              </p>
            ) : null}
          </header>

          <div className="flex flex-wrap gap-2">
            <Button
              size="lg"
              disabled={logWear.isPending}
              onClick={() => logWear.mutate({ sneakerId, label: title })}
            >
              <Footprints aria-hidden />
              {t('sneakers.detail.woreToday')}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate({ to: '/sneakers/$sneakerId/edit', params: { sneakerId } })}
            >
              <Pencil aria-hidden />
              {t('common.edit')}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="lg" disabled={deleteMutation.isPending}>
                  <Trash2 aria-hidden />
                  {t('common.delete')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('sneakers.detail.deleteTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('sneakers.detail.deleteDescription')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() => {
                      setActionError(null);
                      deleteMutation.mutate();
                    }}
                  >
                    {t('common.delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {sneaker.suggestedCondition ? (
            <WearSuggestion
              sneakerId={sneaker.id}
              wearCount={sneaker.wearCount}
              suggestedCondition={sneaker.suggestedCondition}
            />
          ) : null}

          <section aria-label={t('sneakers.detail.marketValueLabel')} className="space-y-2">
            {hasMarketPrice ? (
              <p className="font-heading text-3xl leading-[1.15] tracking-tight text-muted-foreground">
                <Trans
                  i18nKey="sneakers.detail.worth"
                  values={{ value: formatCurrency(sneaker.currentMarketPrice) }}
                  components={{ strong: <strong className="font-semibold text-foreground" /> }}
                />
                {gainLoss != null && sneaker.purchasePrice != null ? (
                  <>
                    {' '}
                    <Trans
                      i18nKey="sneakers.detail.gain"
                      values={{
                        change:
                          gainLoss === 0
                            ? t('sneakers.detail.breakEven')
                            : t(gainLoss > 0 ? 'sneakers.detail.up' : 'sneakers.detail.down', {
                                amount: formatCurrency(Math.abs(gainLoss)),
                              }),
                        paid: formatCurrency(sneaker.purchasePrice),
                      }}
                      components={{
                        tone: (
                          <span
                            className={cn(gainLoss > 0 && 'text-gain', gainLoss < 0 && 'text-loss')}
                          />
                        ),
                      }}
                    />
                  </>
                ) : null}
              </p>
            ) : (
              <p className="text-lg text-muted-foreground">{t('sneakers.detail.noMarketValue')}</p>
            )}
            {hasMarketPrice && disclaimer ? (
              <p className="text-sm text-muted-foreground">{disclaimer}</p>
            ) : null}
            {sneaker.pricedAt ? (
              <p className="text-sm text-muted-foreground">
                {t('sneakers.detail.priceUpdated', { date: formatDate(sneaker.pricedAt) })}
              </p>
            ) : null}
          </section>

          <dl className="divide-y divide-border rounded-2xl bg-card ring-1 ring-border">
            {facts.map((fact) => (
              <div key={fact.label} className="flex items-baseline justify-between gap-4 px-4 py-3">
                <dt className="text-sm text-muted-foreground">{fact.label}</dt>
                <dd className="text-right font-medium">{fact.value}</dd>
              </div>
            ))}
          </dl>

          {sneaker.notes ? (
            <section className="space-y-1">
              <h2 className="font-heading text-lg font-semibold">{t('sneakers.detail.notes')}</h2>
              <p className="whitespace-pre-line text-muted-foreground">{sneaker.notes}</p>
            </section>
          ) : null}

          {sneaker.description ? (
            <section className="space-y-1">
              <h2 className="font-heading text-lg font-semibold">{t('sneakers.detail.about')}</h2>
              <p className="max-w-prose text-muted-foreground">{sneaker.description}</p>
            </section>
          ) : null}
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          {t('sneakers.detail.priceHistory')}
        </h2>
        {priceHistoryLoading ? (
          <Skeleton className="h-24 w-full rounded-2xl" />
        ) : (
          <PriceHistory
            history={priceHistoryData?.history ?? []}
            purchasePrice={sneaker.purchasePrice}
          />
        )}
      </section>

      {actionError ? (
        <p className="text-sm text-destructive" role="alert">
          {actionError}
        </p>
      ) : null}
    </div>
  );
}
