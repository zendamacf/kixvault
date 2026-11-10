import type { CreateSneakerFromCatalogInput, CreateSneakerInput } from '@kixvault/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
        throw new Error(await parseApiError(response, t('errors.addSneakerFromCatalog')));
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
        throw new Error(await parseApiError(response, t('errors.createSneaker')));
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
        <BackLink to="/">{t('common.backToCollection')}</BackLink>
        <div className="space-y-1">
          <h1 className="font-heading text-4xl font-semibold tracking-tight">
            {t('sneakers.new.title')}
          </h1>
          <p className="text-muted-foreground">{t('sneakers.new.description')}</p>
        </div>
        <SegmentedControl
          label={t('sneakers.new.modeLabel')}
          value={mode}
          options={[
            { value: 'catalog', label: t('sneakers.new.searchCatalog') },
            { value: 'manual', label: t('sneakers.new.manual') },
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
          submitLabel={t('sneakers.new.submit')}
          isSubmitting={isSubmitting}
          onSubmit={async (values) => {
            setFormError(null);
            await createFromCatalogMutation.mutateAsync(values);
          }}
        />
      ) : (
        <ManualSneakerForm
          submitLabel={t('sneakers.new.submit')}
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
