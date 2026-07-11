import type { CreateSneakerInput } from '@kixvault/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { SneakerForm } from '@/components/sneakers/sneaker-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api, parseApiError } from '@/lib/api';

export const Route = createFileRoute('/_authenticated/sneakers/new')({
  component: NewSneakerPage,
});

function NewSneakerPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async (values: CreateSneakerInput) => {
      const response = await api.api.sneakers.$post({ json: values });

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to create sneaker'));
      }

      return response.json();
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['sneakers'] });
      await queryClient.invalidateQueries({ queryKey: ['stats'] });
      await navigate({ to: '/sneakers/$sneakerId', params: { sneakerId: data.sneaker.id } });
    },
    onError: (error) => {
      setFormError(error.message);
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to collection
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Add a pair</CardTitle>
          <CardDescription>
            Search the catalog to find your pair, or enter details manually.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formError ? <p className="mb-4 text-sm text-destructive">{formError}</p> : null}
          <SneakerForm
            enableCatalogSearch
            submitLabel="Add to collection"
            isSubmitting={createMutation.isPending}
            onSubmit={async (values) => {
              await createMutation.mutateAsync(values);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
