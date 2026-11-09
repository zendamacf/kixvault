import type { CreateWishlistFromCatalogInput, CreateWishlistItemInput } from '@kixvault/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { BackLink } from '@/components/layout/back-link';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { WishlistCatalogForm } from '@/components/wishlist/wishlist-catalog-form';
import { WishlistManualForm } from '@/components/wishlist/wishlist-manual-form';
import { api, parseApiError } from '@/lib/api';

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
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-5">
        <BackLink to="/grails">Back to grails</BackLink>
        <div className="space-y-1">
          <h1 className="font-display text-4xl font-semibold tracking-tight">Add a grail</h1>
          <p className="max-w-xl text-muted-foreground">
            Search StockX or enter details manually. Grails stay separate until you move them to
            your collection.
          </p>
        </div>
        <SegmentedControl
          label="How to add this grail"
          value={mode}
          options={[
            { value: 'catalog', label: 'From catalog' },
            { value: 'manual', label: 'Manual entry' },
          ]}
          onChange={(value) => {
            setMode(value);
            setFormError(null);
          }}
        />
      </div>

      {formError ? (
        <p className="text-sm text-destructive" role="alert">
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
    </div>
  );
}
