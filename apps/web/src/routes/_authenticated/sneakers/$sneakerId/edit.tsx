import type { CreateSneakerInput, SneakerCondition } from '@kixvault/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { SneakerForm } from '@/components/sneakers/sneaker-form';
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
    mutationFn: async (values: CreateSneakerInput) => {
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

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        to="/sneakers/$sneakerId"
        params={{ sneakerId }}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to details
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Edit pair</CardTitle>
          <CardDescription>
            Update {sneaker.brand} {sneaker.model}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formError ? <p className="mb-4 text-sm text-destructive">{formError}</p> : null}
          <SneakerForm
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
              sku: sneaker.sku,
              imageUrl: sneaker.imageUrl,
              catalogSource: sneaker.catalogSource as CreateSneakerInput['catalogSource'],
              catalogId: sneaker.catalogId,
              releaseDate: sneaker.releaseDate ?? '',
              description: sneaker.description,
            }}
            onSubmit={async (values) => {
              await updateMutation.mutateAsync(values);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
