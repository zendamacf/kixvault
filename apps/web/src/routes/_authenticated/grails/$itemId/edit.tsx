import type { MoveWishlistToCollectionInput, UpdateWishlistItemInput } from '@kixvault/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Trash2 } from 'lucide-react';
import { BackLink } from '@/components/layout/back-link';
import { SneakerThumbnail } from '@/components/sneakers/sneaker-thumbnail';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MoveToCollectionForm } from '@/components/wishlist/move-to-collection-form';
import { WishlistManualForm } from '@/components/wishlist/wishlist-manual-form';
import { api, parseApiError } from '@/lib/api';
import { wishlistItemQueryOptions } from '@/lib/queries';
import { showGrailClearedToast } from '@/lib/wishlist';

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

      if (item) {
        showGrailClearedToast([{ brand: item.brand, model: item.model }]);
      }

      await queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      await queryClient.invalidateQueries({ queryKey: ['sneakers'] });
      await queryClient.invalidateQueries({ queryKey: ['stats'] });
      await navigate({ to: '/sneakers/$sneakerId', params: { sneakerId: data.sneaker.id } });
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <BackLink to="/grails">Back to grails</BackLink>
        <p className="text-sm text-destructive" role="alert">
          Grail not found.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div className="space-y-5">
        <BackLink to="/grails">Back to grails</BackLink>
        <div className="flex items-center gap-5">
          <div className="w-28 shrink-0 rounded-2xl bg-card ring-1 ring-border">
            <SneakerThumbnail
              imageUrl={item.imageUrl}
              alt={`${item.brand} ${item.model}`}
              className="aspect-[5/4] w-full rounded-none p-2"
            />
          </div>
          <h1 className="font-heading text-3xl leading-[1.1] tracking-tight sm:text-4xl">
            <span className="font-normal text-muted-foreground">{item.brand}</span>{' '}
            <span className="font-semibold">{item.model}</span>
          </h1>
        </div>
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

      <div>
        <Button
          type="button"
          variant="destructive"
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
        >
          <Trash2 aria-hidden />
          Remove from grails
        </Button>
      </div>
    </div>
  );
}
