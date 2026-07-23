import { SneakerBrandBadge } from '@/components/sneakers/sneaker-brand-badge';
import { SneakerThumbnail } from '@/components/sneakers/sneaker-thumbnail';

export type CatalogSneakerSummaryData = {
  imageUrl: string | null;
  title: string;
  brand: string;
  nickname?: string | null;
  colorway?: string | null;
  sku?: string | null;
};

type CatalogSneakerSummaryProps = {
  sneaker: CatalogSneakerSummaryData;
};

/** Read-only product summary shown when adding or editing a catalog-linked sneaker. */
export function CatalogSneakerSummary({ sneaker }: CatalogSneakerSummaryProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-background/60 p-4 sm:flex-row sm:items-center">
      <SneakerThumbnail
        imageUrl={sneaker.imageUrl}
        alt={sneaker.title}
        className="h-48 w-48 shrink-0 sm:h-56 sm:w-56"
      />
      <div className="min-w-0 space-y-1">
        <p className="font-medium">{sneaker.title}</p>
        <SneakerBrandBadge brand={sneaker.brand} />
        {sneaker.nickname ? (
          <p className="text-sm text-foreground">{`"${sneaker.nickname}"`}</p>
        ) : null}
        {sneaker.colorway ? (
          <p className="text-sm text-muted-foreground">{sneaker.colorway}</p>
        ) : null}
        {sneaker.sku ? <p className="text-sm text-muted-foreground">SKU {sneaker.sku}</p> : null}
      </div>
    </div>
  );
}
