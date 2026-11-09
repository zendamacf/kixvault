import { ToggleGroup } from 'radix-ui';
import { cn } from '@/lib/utils';

type SegmentedControlOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  label: string;
  value: T;
  options: SegmentedControlOption<T>[];
  onChange: (value: T) => void;
  className?: string;
};

/**
 * Pill-shaped switch between a small set of mutually exclusive modes.
 * Built on Radix ToggleGroup, so arrow keys move between options and one option is always on.
 */
export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <ToggleGroup.Root
      type="single"
      aria-label={label}
      value={value}
      onValueChange={(next) => {
        // Radix reports an empty value when the active item is pressed again; keep the mode.
        if (next) {
          onChange(next as T);
        }
      }}
      className={cn('inline-flex w-full rounded-full bg-muted p-1 sm:w-fit', className)}
    >
      {options.map((option) => (
        <ToggleGroup.Item
          key={option.value}
          value={option.value}
          className="h-9 flex-1 rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=on]:bg-foreground data-[state=on]:text-background sm:flex-none"
        >
          {option.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
