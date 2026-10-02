import type { CatalogSearchResult, CreateWishlistFromCatalogInput } from '@kixvault/shared';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { CatalogSearchPicker } from '@/components/sneakers/catalog-search-picker';
import { CatalogSneakerSummary } from '@/components/sneakers/catalog-sneaker-summary';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { catalogProductQueryOptions } from '@/lib/catalog';

type WishlistCatalogFormProps = {
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (values: CreateWishlistFromCatalogInput) => Promise<void>;
};

/** Catalog search flow for adding a grail via the wishlist from-catalog API. */
export function WishlistCatalogForm({
  submitLabel,
  isSubmitting = false,
  onSubmit,
}: WishlistCatalogFormProps) {
  const [selectedResult, setSelectedResult] = useState<CatalogSearchResult | null>(null);
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [notes, setNotes] = useState('');

  const {
    data: catalogProduct,
    isLoading,
    error,
  } = useQuery({
    ...catalogProductQueryOptions(selectedResult?.catalogId ?? ''),
    enabled: selectedResult != null,
  });

  const summary = catalogProduct?.product ?? selectedResult;

  return (
    <div className="grid gap-5">
      {!selectedResult ? (
        <CatalogSearchPicker query={query} onQueryChange={setQuery} onSelect={setSelectedResult} />
      ) : (
        <>
          <button
            type="button"
            className="inline-flex w-fit text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setSelectedResult(null)}
          >
            ← Back to search
          </button>

          {isLoading ? (
            <div className="space-y-4 rounded-lg border bg-background/60 p-4">
              <Skeleton className="h-48 w-48 rounded-md" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error.message}</p> : null}

          {summary ? (
            <form
              className="grid gap-5"
              onSubmit={async (event) => {
                event.preventDefault();
                await onSubmit({
                  catalogSource: 'kicksdb:stockx',
                  catalogId: selectedResult.catalogId,
                  priority,
                  notes: notes.trim() ? notes.trim() : null,
                });
              }}
            >
              <CatalogSneakerSummary
                sneaker={{
                  imageUrl: summary.imageUrl,
                  title: summary.title,
                  brand: summary.brand,
                  nickname: summary.nickname,
                  colorway: summary.colorway,
                  sku: summary.sku,
                }}
              />
              <div className="grid gap-2">
                <Label htmlFor="wishlist-priority">Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(value) => setPriority(value as typeof priority)}
                >
                  <SelectTrigger id="wishlist-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="wishlist-notes">Notes</Label>
                <Textarea
                  id="wishlist-notes"
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </div>
              <Button type="submit" disabled={isSubmitting || isLoading}>
                {submitLabel}
              </Button>
            </form>
          ) : null}
        </>
      )}
    </div>
  );
}
