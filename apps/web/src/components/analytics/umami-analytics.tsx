import { useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';
import { ensureUmamiScript, isUmamiConfigured, trackUmamiPageview } from '@/lib/umami';

/** Loads Umami when configured and records pageviews on TanStack Router navigations. */
export function UmamiAnalytics() {
  const router = useRouter();

  useEffect(() => {
    if (!isUmamiConfigured()) {
      return;
    }

    const trackCurrentPage = () => {
      void ensureUmamiScript()
        .then(() => {
          trackUmamiPageview();
        })
        .catch(() => {
          // Analytics must not affect app behavior.
        });
    };

    trackCurrentPage();

    return router.subscribe('onResolved', () => {
      trackCurrentPage();
    });
  }, [router]);

  return null;
}
