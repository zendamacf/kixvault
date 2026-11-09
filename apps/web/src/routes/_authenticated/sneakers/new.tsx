import type { CreateSneakerFromCatalogInput, CreateSneakerInput } from '@kixvault/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { BackLink } from '@/components/layout/back-link';
import { CatalogSneakerForm } from '@/components/sneakers/catalog-sneaker-form';
import { ManualSneakerForm } from '@/components/sneakers/manual-sneaker-form';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { api, parseApiError } from '@/lib/api';
import { trackUmamiEvent } from '@/lib/umami';
import { UmamiEvents } from '@/lib/umami-events';
import { showGrailClearedToast } from '@/lib/wishlist';

type AddMode = 'catalog' | 'manual';

export const Route = createFileRoute('/_authenticated/sneakers/new')({
  component: NewSneakerPage,
});

function NewSneakerPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<AddMode>('catalog');
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreateSuccess = async (data: {
    sneaker: { id: string };
    clearedGrails?: Array<{ brand: string; model: string }>;
  }) => {
    if (data.clearedGrails?.length) {
      showGrailClearedToast(data.clearedGrails);
      await queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    }

    await queryClient.invalidateQueries({ queryKey: ['sneakers'] });
    await queryClient.invalidateQueries({ queryKey: ['stats'] });
    await navigate({ to: '/sneakers/$sneakerId', params: { sneakerId: data.sneaker.id } });
  };

  const createFromCatalogMutation = useMutation({
    mutationFn: async (values: CreateSneakerFromCatalogInput) => {
      const response = await api.api.sneakers['from-catalog'].$post({ json: values });

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to add sneaker from catalog'));
      }

      return response.json();
    },
    onSuccess: async (data) => {
      if (!('sneaker' in data)) {
        return;
      }

      trackUmamiEvent(UmamiEvents.sneakerCreate, { source: 'catalog' });
      await handleCreateSuccess(data);
    },
    onError: (error) => {
      setFormError(error.message);
    },
  });

  const createManualMutation = useMutation({
    mutationFn: async (values: CreateSneakerInput) => {
      const response = await api.api.sneakers.custom.$post({ json: values });

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to create sneaker'));
      }

      return response.json();
    },
    onSuccess: async (data) => {
      if (!('sneaker' in data)) {
        return;
      }

      trackUmamiEvent(UmamiEvents.sneakerCreate, { source: 'manual' });
      await handleCreateSuccess(data);
    },
    onError: (error) => {
      setFormError(error.message);
    },
  });

  const isSubmitting = createFromCatalogMutation.isPending || createManualMutation.isPending;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-5">
        <BackLink to="/">Back to collection</BackLink>
        <div className="space-y-1">
          <h1 className="font-display text-4xl font-semibold tracking-tight">Add a pair</h1>
          <p className="text-muted-foreground">
            Search the catalog to find your pair, or enter details manually.
          </p>
        </div>
        <SegmentedControl
          label="How to add this pair"
          value={mode}
          options={[
            { value: 'catalog', label: 'Search catalog' },
            { value: 'manual', label: 'Enter manually' },
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
        <CatalogSneakerForm
          submitLabel="Add to collection"
          isSubmitting={isSubmitting}
          onSubmit={async (values) => {
            setFormError(null);
            await createFromCatalogMutation.mutateAsync(values);
          }}
        />
      ) : (
        <ManualSneakerForm
          submitLabel="Add to collection"
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
