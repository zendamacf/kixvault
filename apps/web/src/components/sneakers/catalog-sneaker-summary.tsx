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
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-4 ring-1 ring-border sm:flex-row sm:items-center sm:gap-6">
      <SneakerThumbnail
        imageUrl={sneaker.imageUrl}
        alt={sneaker.title}
        className="h-44 w-full shrink-0 sm:h-40 sm:w-52"
      />
      <div className="min-w-0 space-y-1">
        <h2 className="font-heading text-xl leading-snug font-semibold">{sneaker.title}</h2>
        {sneaker.title.toLowerCase().startsWith(sneaker.brand.toLowerCase()) ? null : (
          <p className="text-sm text-muted-foreground">{sneaker.brand}</p>
        )}
        {sneaker.nickname ? (
          <p className="text-sm text-foreground">{`"${sneaker.nickname}"`}</p>
        ) : null}
        {sneaker.colorway ? (
          <p className="text-sm text-muted-foreground">{sneaker.colorway}</p>
        ) : null}
        {sneaker.sku ? <p className="text-sm text-muted-foreground">{sneaker.sku}</p> : null}
      </div>
    </div>
  );
}
