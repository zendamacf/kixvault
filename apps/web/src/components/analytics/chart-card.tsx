import type { ReactNode } from 'react';

type ChartCardProps = {
  title: string;
  description: string;
  /** Shown instead of the chart when there is nothing to plot. */
  emptyMessage: string;
  isEmpty: boolean;
  children: ReactNode;
  footnote?: string;
};

/** Titled card shared by the analytics charts, with an empty state. */
export function ChartCard({
  title,
  description,
  emptyMessage,
  isEmpty,
  children,
  footnote,
}: ChartCardProps) {
  return (
    <section className="space-y-3 rounded-2xl bg-card p-4 ring-1 ring-border sm:p-5">
      <div className="space-y-0.5">
        <h2 className="font-heading text-lg font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {isEmpty ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        children
      )}
      {footnote && !isEmpty ? <p className="text-xs text-muted-foreground">{footnote}</p> : null}
    </section>
  );
}
