import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { BackLink } from '@/components/layout/back-link';
import { MarketValue } from '@/components/sneakers/market-value';
import { PriceHistory } from '@/components/sneakers/price-history';
import { SneakerBrandBadge } from '@/components/sneakers/sneaker-brand-badge';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api, parseApiError } from '@/lib/api';
import { sneakerPriceHistoryQueryOptions, sneakerQueryOptions } from '@/lib/queries';
import { formatCondition, formatCurrency, formatDate, getCatalogSourceLabel } from '@/lib/utils';

export const Route = createFileRoute('/_authenticated/sneakers/$sneakerId/')({
  component: SneakerDetailPage,
});

function SneakerDetailPage() {
  const { sneakerId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const { data, isLoading, error } = useQuery(sneakerQueryOptions(sneakerId));
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
      <div className="space-y-4">
        <Skeleton className="h-4 w-36" />
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <Skeleton className="h-48 w-full max-w-xs rounded-md sm:h-56" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data?.sneaker) {
    return (
      <div>
        <p className="text-sm text-destructive">{error?.message ?? 'Sneaker not found'}</p>
      </div>
    );
  }

  const sneaker = data.sneaker;
  const title = `${sneaker.brand} ${sneaker.model}`;
  const catalogSourceLabel = getCatalogSourceLabel(sneaker.catalogSource);

  return (
    <div className="space-y-4">
      <BackLink to="/">← Back to collection</BackLink>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row items-center">
              <SneakerThumbnail
                imageUrl={sneaker.imageUrl}
                alt={title}
                className="h-64 w-full max-w-xs sm:h-72"
              />
              <div className="space-y-2">
                <SneakerBrandBadge brand={sneaker.brand} />
                <CardTitle className="text-2xl sm:text-3xl">{title}</CardTitle>
                {sneaker.nickname ? (
                  <p className="text-base font-medium text-foreground">{`"${sneaker.nickname}"`}</p>
                ) : null}
                <p className="text-muted-foreground">{sneaker.colorway || 'No colorway listed'}</p>
                {sneaker.sku ? (
                  <p className="text-sm text-muted-foreground">SKU {sneaker.sku}</p>
                ) : null}
                <div>
                  <Badge>{formatCondition(sneaker.condition)}</Badge>
                </div>
                {sneaker.catalogUrl && catalogSourceLabel ? (
                  <a
                    href={sneaker.catalogUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex text-sm text-primary hover:underline"
                  >
                    View on {catalogSourceLabel}
                  </a>
                ) : null}
              </div>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => navigate({ to: '/sneakers/$sneakerId/edit', params: { sneakerId } })}
              >
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full sm:w-auto"
                    disabled={deleteMutation.isPending}
                  >
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
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {sneaker.description ? (
            <div className="sm:col-span-2">
              <StaticDetailItem label="Description" value={sneaker.description} />
            </div>
          ) : null}
          {sneaker.releaseDate ? (
            <StaticDetailItem label="Release date" value={formatDate(sneaker.releaseDate)} />
          ) : null}
          <StaticDetailItem label="Added" value={formatDate(sneaker.createdAt)} />
          <DetailItem label="Size" value={String(sneaker.size)} />
          <DetailItem label="Purchase price" value={formatCurrency(sneaker.purchasePrice)} />
          <DetailItem label="Purchase date" value={formatDate(sneaker.purchaseDate)} />
          <div className="rounded-lg border border-border bg-background/60 p-4">
            <p className="text-sm font-medium text-muted-foreground">Market value</p>
            <MarketValue
              price={sneaker.currentMarketPrice}
              gainLoss={sneaker.gainLoss}
              condition={sneaker.condition}
              className="mt-2"
            />
            {sneaker.pricedAt ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Last updated {formatDate(sneaker.pricedAt)}
              </p>
            ) : null}
          </div>
          <div className="sm:col-span-2 rounded-lg border border-border bg-background/60 p-4">
            <p className="text-sm font-medium text-muted-foreground">Price history</p>
            <div className="mt-3">
              {priceHistoryLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <PriceHistory history={priceHistoryData?.history ?? []} />
              )}
            </div>
          </div>
          <div className="sm:col-span-2">
            <DetailItem label="Notes" value={sneaker.notes || '—'} />
          </div>
        </CardContent>
      </Card>

      {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/60 p-4">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-base">{value}</p>
    </div>
  );
}

function StaticDetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-base">{value}</p>
    </div>
  );
}
