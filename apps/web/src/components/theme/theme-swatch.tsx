import { cn } from '@/lib/utils';
import { useMode } from './mode';

/**
 * Preview strip for a colorway in the current mode: stage, chrome and accent. It scopes the real
 * tokens with `data-theme` (and `dark`), so it can never drift from index.css.
 */
export function ThemeSwatch({ id }: { id: string }) {
  const { resolvedMode } = useMode();

  return (
    <span
      aria-hidden="true"
      data-theme={id}
      className={cn(
        resolvedMode === 'dark' && 'dark',
        'flex h-1.5 overflow-hidden rounded-full ring-1 ring-foreground/25',
      )}
    >
      <span className="flex-1 bg-background" />
      <span className="flex-1 bg-chrome" />
      <span className="flex-1 bg-primary" />
    </span>
  );
}
