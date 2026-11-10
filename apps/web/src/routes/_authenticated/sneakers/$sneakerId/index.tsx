import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Footprints, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
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

export const Route = createFileRoute('/_authenticated/sneakers/$sneakerId/')({
  component: SneakerDetailPage,
});

function SneakerDetailPage() {
  const { sneakerId } = Route.useParams();
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
        throw new Error(await parseApiError(response, 'Failed to delete sneaker'));
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
        <BackLink to="/">Back to collection</BackLink>
        <p className="text-sm text-destructive" role="alert">
          {error?.message ?? 'Sneaker not found'}
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
    { label: 'Size', value: String(sneaker.size) },
    { label: 'Condition', value: formatCondition(sneaker.condition) },
    {
      label: 'Worn',
      value:
        sneaker.wearCount === 0
          ? 'Never'
          : `${sneaker.wearCount} ${sneaker.wearCount === 1 ? 'time' : 'times'}${
              sneaker.lastWornOn ? `, last ${formatDate(sneaker.lastWornOn)}` : ''
            }`,
    },
    ...(sneaker.purchasePrice != null
      ? [{ label: 'Paid', value: formatCurrency(sneaker.purchasePrice) }]
      : []),
    ...(sneaker.purchaseDate
      ? [{ label: 'Purchased', value: formatDate(sneaker.purchaseDate) }]
      : []),
    ...(sneaker.releaseDate ? [{ label: 'Released', value: formatDate(sneaker.releaseDate) }] : []),
    { label: 'Added to vault', value: formatDate(sneaker.createdAt) },
  ];

  return (
    <div className="space-y-10">
      <BackLink to="/">Back to collection</BackLink>

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
              <p className="text-muted-foreground">{sneaker.colorway || 'No colorway listed'}</p>
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
                    View on {catalogSourceLabel}
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
              Wore today
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate({ to: '/sneakers/$sneakerId/edit', params: { sneakerId } })}
            >
              <Pencil aria-hidden />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="lg" disabled={deleteMutation.isPending}>
                  <Trash2 aria-hidden />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this pair?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove it from your collection. This action cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() => {
                      setActionError(null);
                      deleteMutation.mutate();
                    }}
                  >
                    Delete
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

          <section aria-label="Market value" className="space-y-2">
            {hasMarketPrice ? (
              <p className="font-heading text-3xl leading-[1.15] tracking-tight text-muted-foreground">
                Worth{' '}
                <strong className="font-semibold text-foreground">
                  {formatCurrency(sneaker.currentMarketPrice)}
                </strong>{' '}
                today.
                {gainLoss != null && sneaker.purchasePrice != null ? (
                  <>
                    {' '}
                    <span className={cn(gainLoss > 0 && 'text-gain', gainLoss < 0 && 'text-loss')}>
                      {gainLoss === 0
                        ? 'Break-even'
                        : `${gainLoss > 0 ? 'Up' : 'Down'} ${formatCurrency(Math.abs(gainLoss))}`}
                    </span>{' '}
                    on the {formatCurrency(sneaker.purchasePrice)} you paid.
                  </>
                ) : null}
              </p>
            ) : (
              <p className="text-lg text-muted-foreground">
                No market value is available for this pair.
              </p>
            )}
            {hasMarketPrice && disclaimer ? (
              <p className="text-sm text-muted-foreground">{disclaimer}</p>
            ) : null}
            {sneaker.pricedAt ? (
              <p className="text-sm text-muted-foreground">
                Price updated {formatDate(sneaker.pricedAt)}
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
              <h2 className="font-heading text-lg font-semibold">Notes</h2>
              <p className="whitespace-pre-line text-muted-foreground">{sneaker.notes}</p>
            </section>
          ) : null}

          {sneaker.description ? (
            <section className="space-y-1">
              <h2 className="font-heading text-lg font-semibold">About this pair</h2>
              <p className="max-w-prose text-muted-foreground">{sneaker.description}</p>
            </section>
          ) : null}
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">Price history</h2>
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
