import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { SneakerThumbnail } from '@/components/sneakers/sneaker-thumbnail';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api, parseApiError } from '@/lib/api';
import { sneakerQueryOptions } from '@/lib/queries';
import { formatCondition, formatCurrency, formatDate } from '@/lib/utils';

export const Route = createFileRoute('/_authenticated/sneakers/$sneakerId/')({
  component: SneakerDetailPage,
});

function SneakerDetailPage() {
  const { sneakerId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const { data, isLoading, error } = useQuery(sneakerQueryOptions(sneakerId));

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
      <div className="mx-auto max-w-3xl space-y-4">
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
      <div className="mx-auto max-w-3xl">
        <p className="text-sm text-destructive">{error?.message ?? 'Sneaker not found'}</p>
      </div>
    );
  }

  const sneaker = data.sneaker;
  const title = `${sneaker.brand} ${sneaker.model}`;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link to="/" className="inline-flex text-sm text-muted-foreground hover:text-foreground">
        ← Back to collection
      </Link>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <SneakerThumbnail
                imageUrl={sneaker.imageUrl}
                alt={title}
                className="h-64 w-full max-w-xs sm:h-72"
              />
              <div className="space-y-2">
                <CardTitle className="text-2xl sm:text-3xl">{title}</CardTitle>
                <p className="text-muted-foreground">{sneaker.colorway || 'No colorway listed'}</p>
                {sneaker.sku ? (
                  <p className="text-sm text-muted-foreground">SKU {sneaker.sku}</p>
                ) : null}
                <Badge>{formatCondition(sneaker.condition)}</Badge>
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
              <Button
                variant="destructive"
                className="w-full sm:w-auto"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (window.confirm('Delete this pair from your collection?')) {
                    setActionError(null);
                    deleteMutation.mutate();
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailItem label="Size" value={String(sneaker.size)} />
          <DetailItem label="Purchase price" value={formatCurrency(sneaker.purchasePrice)} />
          <DetailItem label="Purchase date" value={formatDate(sneaker.purchaseDate)} />
          <DetailItem label="Added" value={formatDate(sneaker.createdAt)} />
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
