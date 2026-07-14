import { createLink } from '@tanstack/react-router';
import { type ComponentPropsWithoutRef, forwardRef } from 'react';
import { cn } from '@/lib/utils';

const BackLinkComponent = forwardRef<HTMLAnchorElement, ComponentPropsWithoutRef<'a'>>(
  function BackLinkComponent({ className, ...props }, ref) {
    return (
      <a
        ref={ref}
        className={cn('inline-flex text-sm text-muted-foreground hover:text-foreground', className)}
        {...props}
      />
    );
  },
);

/** Router-aware link styled for “← Back to …” navigation between pages. */
export const BackLink = createLink(BackLinkComponent);
