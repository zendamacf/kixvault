import { Link } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SneakerThumbnail } from '@/components/sneakers/sneaker-thumbnail';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useRemoveWear } from '@/lib/wear-actions';
import {
  buildMonthGrid,
  type CalendarWear,
  groupWearsByDay,
  parseIsoDate,
  toIsoDate,
} from '@/lib/wears';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MAX_THUMBNAILS = 3;

type WearCalendarProps = {
  year: number;
  month: number;
  wears: CalendarWear[];
  onMonthChange: (year: number, month: number) => void;
  onAddWear: (date: string) => void;
};

function wearLabel(wear: CalendarWear): string {
  return `${wear.brand} ${wear.model}`;
}

/** Month grid of worn pairs. Days with wears open a dialog to review or remove them. */
export function WearCalendar({ year, month, wears, onMonthChange, onAddWear }: WearCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const removeWear = useRemoveWear();

  const weeks = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const wearsByDay = useMemo(() => groupWearsByDay(wears), [wears]);

  const today = toIsoDate(new Date());
  const monthLabel = new Date(year, month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  function goToMonth(offset: number) {
    const next = new Date(year, month + offset, 1);
    onMonthChange(next.getFullYear(), next.getMonth());
  }

  const selectedWears = selectedDate ? (wearsByDay.get(selectedDate) ?? []) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-2xl font-semibold tracking-tight" aria-live="polite">
          {monthLabel}
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const now = new Date();
              onMonthChange(now.getFullYear(), now.getMonth());
            }}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous month"
            onClick={() => goToMonth(-1)}
          >
            <ChevronLeft aria-hidden />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next month"
            onClick={() => goToMonth(1)}
          >
            <ChevronRight aria-hidden />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
        <div className="grid grid-cols-7 border-b border-border bg-muted/50 text-center text-xs font-medium text-muted-foreground">
          {WEEKDAYS.map((weekday) => (
            <div key={weekday} className="py-2">
              {weekday}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {weeks.flat().map((day) => {
            const iso = toIsoDate(day);
            const dayWears = wearsByDay.get(iso) ?? [];
            const inMonth = day.getMonth() === month;
            const isToday = iso === today;
            const isFuture = iso > today;
            const visible = dayWears.slice(0, MAX_THUMBNAILS);
            const extra = dayWears.length - visible.length;

            return (
              <button
                key={iso}
                type="button"
                disabled={isFuture}
                onClick={() => setSelectedDate(iso)}
                aria-label={`${day.toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}, ${dayWears.length} ${dayWears.length === 1 ? 'wear' : 'wears'}`}
                className={cn(
                  'flex min-h-20 flex-col gap-1 border-r border-b border-border p-1.5 text-left outline-none transition-colors last:border-r-0 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring sm:min-h-28 sm:p-2',
                  'hover:bg-muted/60 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent',
                  !inMonth && 'bg-muted/30 text-muted-foreground',
                )}
              >
                <span
                  className={cn(
                    'inline-flex size-6 items-center justify-center rounded-full text-xs font-medium',
                    isToday && 'bg-primary text-primary-foreground',
                  )}
                >
                  {day.getDate()}
                </span>
                {dayWears.length > 0 ? (
                  <span className="flex flex-wrap items-center gap-1">
                    {visible.map((wear) => (
                      <SneakerThumbnail
                        key={wear.id}
                        imageUrl={wear.primaryImage?.url ?? null}
                        alt=""
                        className="size-7 rounded-md bg-background p-0.5 ring-1 ring-border sm:size-9"
                      />
                    ))}
                    {extra > 0 ? (
                      <span className="text-xs font-medium text-muted-foreground">+{extra}</span>
                    ) : null}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <Dialog
        open={selectedDate !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDate(null);
          }
        }}
      >
        <DialogContent className="gap-4 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDate
                ? parseIsoDate(selectedDate).toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })
                : ''}
            </DialogTitle>
            <DialogDescription>
              {selectedWears.length === 0
                ? 'Nothing logged for this day.'
                : `${selectedWears.length} ${selectedWears.length === 1 ? 'pair' : 'pairs'} worn.`}
            </DialogDescription>
          </DialogHeader>

          {selectedWears.length > 0 ? (
            <ul className="space-y-1">
              {selectedWears.map((wear) => (
                <li key={wear.id} className="flex items-center gap-3 rounded-xl px-1 py-1.5">
                  <SneakerThumbnail
                    imageUrl={wear.primaryImage?.url ?? null}
                    alt=""
                    className="size-12 shrink-0 rounded-lg bg-card p-1 ring-1 ring-border"
                  />
                  <Link
                    to="/sneakers/$sneakerId"
                    params={{ sneakerId: wear.sneakerId }}
                    className="min-w-0 flex-1 rounded-md text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="block truncate font-medium">
                      <span className="font-normal text-muted-foreground">{wear.brand}</span>{' '}
                      {wear.model}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {wear.nickname ? `"${wear.nickname}"` : wear.colorway || 'No colorway'}
                    </span>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${wearLabel(wear)} from this day`}
                    disabled={removeWear.isPending}
                    onClick={() =>
                      removeWear.mutate({ sneakerId: wear.sneakerId, wornOn: wear.wornOn })
                    }
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}

          <Button
            variant="outline"
            onClick={() => {
              if (selectedDate) {
                onAddWear(selectedDate);
                setSelectedDate(null);
              }
            }}
          >
            <Plus aria-hidden />
            Add a pair
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
