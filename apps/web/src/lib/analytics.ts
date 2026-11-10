/** Formats a `YYYY-MM` month for chart labels. */
export function formatMonth(value: string | null | undefined, style: 'short' | 'long'): string {
  if (!value) {
    return '—';
  }

  const [year, month] = value.split('-').map(Number);
  if (!year || !month) {
    return value;
  }

  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(undefined, {
    month: style === 'short' ? 'short' : 'long',
    year: style === 'long' || month === 1 ? 'numeric' : undefined,
    timeZone: 'UTC',
  });
}
