import type { CreateWishlistFromCatalogInput, CreateWishlistItemInput } from '@kixvault/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<AddMode>('catalog');
  const [formError, setFormError] = useState<string | null>(null);

  const createFromCatalogMutation = useMutation({
    mutationFn: async (values: CreateWishlistFromCatalogInput) => {
      const response = await api.api.wishlist['from-catalog'].$post({ json: values });

      if (!response.ok) {
        throw new Error(await parseApiError(response, t('errors.addGrailFromCatalog')));
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
        throw new Error(await parseApiError(response, t('errors.addGrail')));
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
        <BackLink to="/grails">{t('common.backToGrails')}</BackLink>
        <div className="space-y-1">
          <h1 className="font-heading text-4xl font-semibold tracking-tight">
            {t('grails.new.title')}
          </h1>
          <p className="max-w-xl text-muted-foreground">{t('grails.new.description')}</p>
        </div>
        <SegmentedControl
          label={t('grails.new.modeLabel')}
          value={mode}
          options={[
            { value: 'catalog', label: t('grails.new.fromCatalog') },
            { value: 'manual', label: t('grails.new.manual') },
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
          submitLabel={isSubmitting ? t('common.saving') : t('grails.add')}
          isSubmitting={isSubmitting}
          onSubmit={async (values) => {
            setFormError(null);
            await createFromCatalogMutation.mutateAsync(values);
          }}
        />
      ) : (
        <WishlistManualForm
          submitLabel={isSubmitting ? t('common.saving') : t('grails.add')}
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
