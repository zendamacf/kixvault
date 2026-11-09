import { Skeleton } from '@/components/ui/skeleton';

/** Loading skeleton for the collection sneaker grid. */
export function SneakerGridSkeleton() {
  return (
    <div aria-hidden className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((id) => (
        <div key={id} className="space-y-3">
          <Skeleton className="aspect-[5/4] w-full rounded-2xl" />
          <div className="space-y-2 px-1">
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-6 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
