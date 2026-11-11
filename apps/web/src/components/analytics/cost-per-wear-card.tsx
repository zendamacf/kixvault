import type { CostPerWearEntry, CostPerWearSummary } from '@kixvault/shared';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { formatCurrencyPrecise } from '@/lib/utils';

function EntryList({ title, entries }: { title: string; entries: CostPerWearEntry[] }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <ol className="space-y-2">
        {entries.map((entry) => (
          <li key={entry.sneakerId} className="flex items-baseline justify-between gap-4 text-sm">
            <Link
              to="/sneakers/$sneakerId"
              params={{ sneakerId: entry.sneakerId }}
              search={{ from: 'analytics' }}
              className="min-w-0 truncate rounded-sm font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              {entry.name}
            </Link>
            <span className="shrink-0 font-medium tabular-nums">
              {formatCurrencyPrecise(entry.costPerWear)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Best and highest cost per wear among pairs still in the vault. */
export function CostPerWearCard({ summary }: { summary: CostPerWearSummary }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {summary.average != null && (
        <p className="text-sm text-muted-foreground">
          {t('analytics.costPerWear.average', { value: formatCurrencyPrecise(summary.average) })}
        </p>
      )}
      <EntryList title={t('analytics.costPerWear.best')} entries={summary.best} />
      {summary.worst.length > 1 && (
        <EntryList title={t('analytics.costPerWear.worst')} entries={summary.worst} />
      )}
    </div>
  );
}
