import { createLink } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { type ComponentPropsWithoutRef, forwardRef } from 'react';
import { cn } from '@/lib/utils';

const BackLinkComponent = forwardRef<HTMLAnchorElement, ComponentPropsWithoutRef<'a'>>(
  function BackLinkComponent({ className, children, ...props }, ref) {
    return (
      <a
        ref={ref}
        className={cn(
          'group inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
        {...props}
      >
        <ArrowLeft
          className="size-4 transition-transform group-hover:-translate-x-0.5"
          aria-hidden
        />
        {children}
      </a>
    );
  },
);

/** Router-aware link for “Back to …” navigation between pages. */
export const BackLink = createLink(BackLinkComponent);
