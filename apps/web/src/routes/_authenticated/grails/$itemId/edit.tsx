import type { MoveWishlistToCollectionInput, UpdateWishlistItemInput } from '@kixvault/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { BackLink } from '@/components/layout/back-link';
import { Button } from '@/components/ui/button';
import { MoveToCollectionForm } from '@/components/wishlist/move-to-collection-form';
import { WishlistManualForm } from '@/components/wishlist/wishlist-manual-form';
import { api, parseApiError } from '@/lib/api';
import { wishlistItemQueryOptions } from '@/lib/queries';

export const Route = createFileRoute('/_authenticated/grails/$itemId/edit')({
  component: EditGrailPage,
});

function EditGrailPage() {
  const { itemId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery(wishlistItemQueryOptions(itemId));
  const item = data?.item;

  const updateMutation = useMutation({
    mutationFn: async (values: UpdateWishlistItemInput) => {
      const response = await api.api.wishlist[':id'].$patch({
        param: { id: itemId },
        json: values,
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to update grail'));
      }

      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await api.api.wishlist[':id'].$delete({
        param: { id: itemId },
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to remove grail'));
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      await navigate({ to: '/grails' });
    },
  });

  const moveMutation = useMutation({
    mutationFn: async (values: MoveWishlistToCollectionInput) => {
      const response = await api.api.wishlist[':id']['move-to-collection'].$post({
        param: { id: itemId },
        json: values,
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to move to collection'));
      }

      return response.json();
    },
    onSuccess: async (data) => {
      if (!('sneaker' in data)) {
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      await queryClient.invalidateQueries({ queryKey: ['sneakers'] });
      await queryClient.invalidateQueries({ queryKey: ['stats'] });
      await navigate({ to: '/sneakers/$sneakerId', params: { sneakerId: data.sneaker.id } });
    },
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading grail…</p>;
  }

  if (error || !item) {
    return (
      <div className="space-y-2">
        <BackLink to="/grails">← Back to grails</BackLink>
        <p className="text-sm text-destructive" role="alert">
          Grail not found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <BackLink to="/grails">← Back to grails</BackLink>
        <h1 className="text-2xl font-semibold tracking-tight">
          {item.brand} {item.model}
        </h1>
      </div>

      <WishlistManualForm
        submitLabel={updateMutation.isPending ? 'Saving…' : 'Save changes'}
        isSubmitting={updateMutation.isPending}
        defaultValues={{
          brand: item.brand,
          model: item.model,
          colorway: item.colorway,
          priority: item.priority,
          notes: item.notes,
        }}
        onSubmit={async (values) => {
          await updateMutation.mutateAsync(values);
        }}
      />

      <MoveToCollectionForm
        isSubmitting={moveMutation.isPending}
        onSubmit={async (values) => {
          await moveMutation.mutateAsync(values);
        }}
      />

      <Button
        type="button"
        variant="destructive"
        onClick={() => deleteMutation.mutate()}
        disabled={deleteMutation.isPending}
      >
        Remove from grails
      </Button>
    </div>
  );
}
