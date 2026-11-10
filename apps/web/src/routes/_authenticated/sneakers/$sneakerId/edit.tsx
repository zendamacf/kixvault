import type { CreateSneakerInput, SneakerCondition, UpdateSneakerInput } from '@kixvault/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BackLink } from '@/components/layout/back-link';
import { CollectionSneakerForm } from '@/components/sneakers/collection-sneaker-form';
import { ManualSneakerForm } from '@/components/sneakers/manual-sneaker-form';
import { Skeleton } from '@/components/ui/skeleton';
import { api, parseApiError } from '@/lib/api';
import { sneakerQueryOptions } from '@/lib/queries';
import { trackUmamiEvent } from '@/lib/umami';
import { UmamiEvents } from '@/lib/umami-events';

export const Route = createFileRoute('/_authenticated/sneakers/$sneakerId/edit')({
  component: EditSneakerPage,
});

function EditSneakerPage() {
  const { t } = useTranslation();
  const { sneakerId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const { data, isLoading, error } = useQuery(sneakerQueryOptions(sneakerId));

  const updateMutation = useMutation({
    mutationFn: async (values: UpdateSneakerInput) => {
      const response = await api.api.sneakers[':id'].$patch({
        param: { id: sneakerId },
        json: values,
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response, t('errors.updateSneaker')));
      }

      return response.json();
    },
    onSuccess: async () => {
      trackUmamiEvent(UmamiEvents.sneakerUpdate, { catalog_linked: Boolean(data?.sneaker?.sku) });
      await queryClient.invalidateQueries({ queryKey: ['sneakers'] });
      await queryClient.invalidateQueries({ queryKey: ['stats'] });
      await queryClient.invalidateQueries({ queryKey: ['sneakers', sneakerId] });
      await navigate({ to: '/sneakers/$sneakerId', params: { sneakerId } });
    },
    onError: (mutationError) => {
      setFormError(mutationError.message);
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !data?.sneaker) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <BackLink to="/">{t('common.backToCollection')}</BackLink>
        <p className="text-sm text-destructive" role="alert">
          {error?.message ?? t('sneakers.edit.notFound')}
        </p>
      </div>
    );
  }

  const sneaker = data.sneaker;
  const isCatalogLinked = Boolean(sneaker.sku);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-4">
        <BackLink to="/sneakers/$sneakerId" params={{ sneakerId }}>
          {t('sneakers.edit.backToDetails')}
        </BackLink>
        <div className="space-y-1">
          <h1 className="font-heading text-4xl font-semibold tracking-tight">
            {t('sneakers.edit.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('sneakers.edit.description', { brand: sneaker.brand, model: sneaker.model })}
          </p>
        </div>
      </div>

      {formError ? (
        <p className="text-sm text-destructive" role="alert">
          {formError}
        </p>
      ) : null}

      {isCatalogLinked ? (
        <CollectionSneakerForm
          summary={{
            imageUrl: sneaker.primaryImage?.url ?? null,
            title: `${sneaker.brand} ${sneaker.model}`,
            brand: sneaker.brand,
            nickname: sneaker.nickname,
            colorway: sneaker.colorway,
            sku: sneaker.sku,
          }}
          submitLabel={t('common.saveChanges')}
          isSubmitting={updateMutation.isPending}
          defaultValues={{
            size: sneaker.size,
            condition: sneaker.condition as SneakerCondition,
            purchasePrice: sneaker.purchasePrice,
            purchaseDate: sneaker.purchaseDate ?? '',
            notes: sneaker.notes,
          }}
          onSubmit={async (values) => {
            await updateMutation.mutateAsync(values);
          }}
        />
      ) : (
        <ManualSneakerForm
          submitLabel={t('common.saveChanges')}
          isSubmitting={updateMutation.isPending}
          defaultValues={{
            brand: sneaker.brand,
            model: sneaker.model,
            colorway: sneaker.colorway,
            nickname: sneaker.nickname,
            size: sneaker.size,
            condition: sneaker.condition as SneakerCondition,
            purchasePrice: sneaker.purchasePrice,
            purchaseDate: sneaker.purchaseDate ?? '',
            notes: sneaker.notes,
          }}
          onSubmit={async (values) => {
            await updateMutation.mutateAsync(values as CreateSneakerInput);
          }}
        />
      )}
    </div>
  );
}
