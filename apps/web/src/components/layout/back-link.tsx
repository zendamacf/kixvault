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

export const BackLink = createLink(BackLinkComponent);
