import type { CreateSneakerFromCatalogInput, CreateSneakerInput } from '@kixvault/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { CatalogSneakerForm } from '@/components/sneakers/catalog-sneaker-form';
import { ManualSneakerForm } from '@/components/sneakers/manual-sneaker-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api, parseApiError } from '@/lib/api';
import { cn } from '@/lib/utils';

type AddMode = 'catalog' | 'manual';

export const Route = createFileRoute('/_authenticated/sneakers/new')({
  component: NewSneakerPage,
});

function NewSneakerPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<AddMode>('catalog');
  const [formError, setFormError] = useState<string | null>(null);

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

      await queryClient.invalidateQueries({ queryKey: ['sneakers'] });
      await queryClient.invalidateQueries({ queryKey: ['stats'] });
      await navigate({ to: '/sneakers/$sneakerId', params: { sneakerId: data.sneaker.id } });
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

      await queryClient.invalidateQueries({ queryKey: ['sneakers'] });
      await queryClient.invalidateQueries({ queryKey: ['stats'] });
      await navigate({ to: '/sneakers/$sneakerId', params: { sneakerId: data.sneaker.id } });
    },
    onError: (error) => {
      setFormError(error.message);
    },
  });

  const isSubmitting = createFromCatalogMutation.isPending || createManualMutation.isPending;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to collection
      </Link>

      <Card>
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>Add a pair</CardTitle>
            <CardDescription>
              Search the catalog to find your pair, or enter details manually.
            </CardDescription>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === 'catalog' ? 'default' : 'outline'}
              className={cn(mode !== 'catalog' && 'flex-1 sm:flex-none')}
              onClick={() => {
                setMode('catalog');
                setFormError(null);
              }}
            >
              Search catalog
            </Button>
            <Button
              type="button"
              variant={mode === 'manual' ? 'default' : 'outline'}
              className={cn(mode !== 'manual' && 'flex-1 sm:flex-none')}
              onClick={() => {
                setMode('manual');
                setFormError(null);
              }}
            >
              Enter manually
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {formError ? <p className="mb-4 text-sm text-destructive">{formError}</p> : null}

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
        </CardContent>
      </Card>
    </div>
  );
}
