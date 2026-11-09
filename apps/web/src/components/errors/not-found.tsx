import { Link } from '@tanstack/react-router';
import { ShoeSilhouette } from '@/components/layout/shoe-silhouette';
import { buttonVariants } from '@/components/ui/button';

/** Shown for any URL that does not match a route. */
export function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-6 text-center">
      <ShoeSilhouette className="w-36 text-muted-foreground/40" />
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Page not found</h1>
        <p className="max-w-md text-muted-foreground">
          That page does not exist or has moved. Head back to your collection.
        </p>
      </div>
      <Link to="/" className={buttonVariants({ size: 'lg' })}>
        Back to collection
      </Link>
    </div>
  );
}
