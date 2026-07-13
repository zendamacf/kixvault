import type { CreateSneakerInput, SneakerCondition, UpdateSneakerInput } from '@kixvault/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { BackLink } from '@/components/layout/back-link';
import { CollectionSneakerForm } from '@/components/sneakers/collection-sneaker-form';
import { ManualSneakerForm } from '@/components/sneakers/manual-sneaker-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api, parseApiError } from '@/lib/api';
import { sneakerQueryOptions } from '@/lib/queries';

export const Route = createFileRoute('/_authenticated/sneakers/$sneakerId/edit')({
  component: EditSneakerPage,
});

function EditSneakerPage() {
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
        throw new Error(await parseApiError(response, 'Failed to update sneaker'));
      }

      return response.json();
    },
    onSuccess: async () => {
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
    return <p className="text-sm text-muted-foreground">Loading sneaker...</p>;
  }

  if (error || !data?.sneaker) {
    return <p className="text-sm text-destructive">{error?.message ?? 'Sneaker not found'}</p>;
  }

  const sneaker = data.sneaker;
  const isCatalogLinked = Boolean(sneaker.sku);

  return (
    <div className="space-y-4">
      <BackLink to="/sneakers/$sneakerId" params={{ sneakerId }}>
        ← Back to details
      </BackLink>

      <Card>
        <CardHeader>
          <CardTitle>Edit pair</CardTitle>
          <CardDescription>
            Update {sneaker.brand} {sneaker.model}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formError ? <p className="mb-4 text-sm text-destructive">{formError}</p> : null}

          {isCatalogLinked ? (
            <CollectionSneakerForm
              summary={{
                imageUrl: sneaker.imageUrl,
                title: `${sneaker.brand} ${sneaker.model}`,
                brand: sneaker.brand,
                nickname: sneaker.nickname,
                colorway: sneaker.colorway,
                sku: sneaker.sku,
              }}
              submitLabel="Save changes"
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
              submitLabel="Save changes"
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
        </CardContent>
      </Card>
    </div>
  );
}
