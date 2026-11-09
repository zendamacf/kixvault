import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { SneakerThumbnail } from '@/components/sneakers/sneaker-thumbnail';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { type Sneaker, sneakersQueryOptions } from '@/lib/queries';
import { cn, formatCondition } from '@/lib/utils';
import { useLogWear } from '@/lib/wear-actions';
import {
  matchesSneakerSearch,
  parseIsoDate,
  sortSneakersForQuickLog,
  toIsoDate,
} from '@/lib/wears';

type QuickLogDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** YYYY-MM-DD. Defaults to today. */
  date?: string;
};

function describeWearCount(sneaker: Sneaker): string {
  if (sneaker.wearCount === 0) {
    return 'Never worn';
  }

  return `${sneaker.wearCount} ${sneaker.wearCount === 1 ? 'wear' : 'wears'}`;
}

/** Type-to-filter picker: Enter or a tap logs the highlighted pair and closes. */
export function QuickLogDialog({ open, onOpenChange, date }: QuickLogDialogProps) {
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const { data, isLoading } = useQuery({ ...sneakersQueryOptions({}), enabled: open });
  const logWear = useLogWear();

  const today = toIsoDate(new Date());
  const targetDate = date ?? today;
  const isToday = targetDate === today;

  const results = useMemo(() => {
    const sneakers = (data?.sneakers ?? []) as Sneaker[];

    return sortSneakersForQuickLog(
      sneakers.filter((sneaker) => matchesSneakerSearch(sneaker, search)),
    );
  }, [data, search]);

  useEffect(() => {
    if (open) {
      setSearch('');
      setActiveIndex(0);
    }
  }, [open]);

  function updateSearch(value: string) {
    setSearch(value);
    setActiveIndex(0);
  }

  function choose(sneaker: Sneaker) {
    logWear.mutate({
      sneakerId: sneaker.id,
      wornOn: targetDate,
      label: `${sneaker.brand} ${sneaker.model}`,
    });
    onOpenChange(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const sneaker = results[activeIndex];

      if (sneaker) {
        choose(sneaker);
      }
    }
  }

  const heading = isToday
    ? 'What are you wearing today?'
    : `What did you wear on ${parseIsoDate(targetDate).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })}?`;

  const activeId = results[activeIndex] ? `quick-log-option-${results[activeIndex].id}` : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{heading}</DialogTitle>
          <DialogDescription>Pick a pair to log a wear.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            role="combobox"
            aria-expanded="true"
            aria-controls="quick-log-options"
            aria-activedescendant={activeId}
            aria-label="Search your pairs"
            placeholder="Search your pairs"
            className="pl-9"
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div
          id="quick-log-options"
          role="listbox"
          aria-label="Your pairs"
          className="-mx-1 max-h-80 space-y-0.5 overflow-y-auto px-1"
        >
          {isLoading ? (
            <div className="space-y-2" aria-hidden>
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : null}

          {!isLoading && results.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              {search ? 'No pairs match that search.' : 'Add a pair to start logging wears.'}
            </p>
          ) : null}

          {results.map((sneaker, index) => (
            <div
              key={sneaker.id}
              id={`quick-log-option-${sneaker.id}`}
              role="option"
              aria-selected={index === activeIndex}
              tabIndex={-1}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => choose(sneaker)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  choose(sneaker);
                }
              }}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition-colors',
                index === activeIndex && 'bg-muted',
              )}
            >
              <SneakerThumbnail
                imageUrl={sneaker.primaryImage?.url ?? null}
                alt=""
                className="size-12 shrink-0 rounded-lg bg-card p-1 ring-1 ring-border"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  <span className="font-normal text-muted-foreground">{sneaker.brand}</span>{' '}
                  {sneaker.model}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {sneaker.nickname ? `"${sneaker.nickname}"` : sneaker.colorway || 'No colorway'}
                  {' · '}
                  Size {sneaker.size}
                </p>
              </div>
              <div className="shrink-0 text-right text-xs text-muted-foreground">
                <p>{describeWearCount(sneaker)}</p>
                <p>{formatCondition(sneaker.condition)}</p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
