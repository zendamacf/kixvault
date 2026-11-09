import * as Sentry from '@sentry/react';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { useEffect } from 'react';
import { ShoeSilhouette } from '@/components/layout/shoe-silhouette';
import { Button } from '@/components/ui/button';

export function RouteErrorFallback({ error, reset }: ErrorComponentProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-6 text-center">
      <ShoeSilhouette className="w-36 text-muted-foreground/40" />
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="max-w-md text-muted-foreground">
          An unexpected error occurred. Try again, and if it keeps happening, reload the page.
        </p>
      </div>
      <Button size="lg" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
