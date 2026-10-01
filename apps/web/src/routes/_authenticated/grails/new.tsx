import type { CreateWishlistFromCatalogInput, CreateWishlistItemInput } from '@kixvault/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { BackLink } from '@/components/layout/back-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WishlistCatalogForm } from '@/components/wishlist/wishlist-catalog-form';
import { WishlistManualForm } from '@/components/wishlist/wishlist-manual-form';
import { api, parseApiError } from '@/lib/api';
import { cn } from '@/lib/utils';

type AddMode = 'catalog' | 'manual';

export const Route = createFileRoute('/_authenticated/grails/new')({
  component: NewGrailPage,
});

function NewGrailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<AddMode>('catalog');
  const [formError, setFormError] = useState<string | null>(null);

  const createFromCatalogMutation = useMutation({
    mutationFn: async (values: CreateWishlistFromCatalogInput) => {
      const response = await api.api.wishlist['from-catalog'].$post({ json: values });

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to add grail from catalog'));
      }

      return response.json();
    },
    onSuccess: async (data) => {
      if (!('item' in data)) {
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      await navigate({ to: '/grails/$itemId/edit', params: { itemId: data.item.id } });
    },
    onError: (error) => {
      setFormError(error.message);
    },
  });

  const createManualMutation = useMutation({
    mutationFn: async (values: CreateWishlistItemInput) => {
      const response = await api.api.wishlist.custom.$post({ json: values });

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to add grail'));
      }

      return response.json();
    },
    onSuccess: async (data) => {
      if (!('item' in data)) {
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      await navigate({ to: '/grails/$itemId/edit', params: { itemId: data.item.id } });
    },
    onError: (error) => {
      setFormError(error.message);
    },
  });

  const isSubmitting = createFromCatalogMutation.isPending || createManualMutation.isPending;

  return (
    <div className="space-y-4">
      <BackLink to="/grails">← Back to grails</BackLink>

      <Card>
        <CardHeader>
          <CardTitle>Add a grail</CardTitle>
          <CardDescription>
            Search StockX or enter details manually. Grails stay separate until you move them to
            your collection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={mode === 'catalog' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('catalog')}
            >
              From catalog
            </Button>
            <Button
              type="button"
              variant={mode === 'manual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('manual')}
            >
              Manual entry
            </Button>
          </div>

          {formError ? (
            <p className={cn('text-sm text-destructive')} role="alert">
              {formError}
            </p>
          ) : null}

          {mode === 'catalog' ? (
            <WishlistCatalogForm
              submitLabel={isSubmitting ? 'Saving…' : 'Add grail'}
              isSubmitting={isSubmitting}
              onSubmit={async (values) => {
                setFormError(null);
                await createFromCatalogMutation.mutateAsync(values);
              }}
            />
          ) : (
            <WishlistManualForm
              submitLabel={isSubmitting ? 'Saving…' : 'Add grail'}
              isSubmitting={isSubmitting}
              onSubmit={async (values) => {
                setFormError(null);
                await createManualMutation.mutateAsync(values);
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
