import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { QuickLogDialog } from '@/components/wears/quick-log-dialog';
import { WearCalendar } from '@/components/wears/wear-calendar';
import { wearsQueryOptions } from '@/lib/queries';
import { type CalendarWear, getMonthRange } from '@/lib/wears';

export const Route = createFileRoute('/_authenticated/wears')({
  component: WearsPage,
});

function WearsPage() {
  const now = new Date();
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [addDate, setAddDate] = useState<string | null>(null);

  const range = getMonthRange(view.year, view.month);
  const { data, isLoading, error } = useQuery(wearsQueryOptions(range));
  const wears = (data?.wears ?? []) as CalendarWear[];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-4xl font-semibold tracking-tight">Wear calendar</h1>
        <p className="text-muted-foreground">Every pair you have worn, day by day.</p>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error.message}
        </p>
      ) : null}

      {isLoading ? (
        <Skeleton className="h-[32rem] w-full rounded-2xl" />
      ) : (
        <WearCalendar
          year={view.year}
          month={view.month}
          wears={wears}
          onMonthChange={(year, month) => setView({ year, month })}
          onAddWear={setAddDate}
        />
      )}

      <QuickLogDialog
        open={addDate !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAddDate(null);
          }
        }}
        date={addDate ?? undefined}
      />
    </div>
  );
}
