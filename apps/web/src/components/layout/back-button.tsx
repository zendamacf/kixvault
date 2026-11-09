import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

type BackButtonProps = {
  onClick: () => void;
  children: ReactNode;
};

/** Button version of BackLink for stepping back inside a page, such as a multi-step form. */
export function BackButton({ onClick, children }: BackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex w-fit items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" aria-hidden />
      {children}
    </button>
  );
}
