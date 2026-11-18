import * as Sentry from '@sentry/react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useEffect } from 'react';
import { setActiveCurrency } from '@/lib/currency';
import { exchangeRatesQueryOptions, sessionQueryOptions } from '@/lib/queries';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions);

    if (!session.user) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      });
    }

    if (session.user.currency !== 'USD') {
      // Rates are needed to render amounts; if they fail to load we fall back to USD.
      await context.queryClient.ensureQueryData(exchangeRatesQueryOptions).catch(() => null);
    }

    return { user: session.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext();
  const { data: session } = useQuery(sessionQueryOptions);
  const { data: rates } = useQuery({
    ...exchangeRatesQueryOptions,
    enabled: (session?.user?.currency ?? user.currency) !== 'USD',
  });

  const currency = session?.user?.currency ?? user.currency;
  const rate = rates?.rates[currency] ?? 1;

  // Formatters are plain functions reading this module state, so set it before children render.
  setActiveCurrency(currency, rate);

  useEffect(() => {
    Sentry.setUser({ id: user.id });

    return () => {
      Sentry.setUser(null);
    };
  }, [user.id]);

  // Re-mount the tree when the currency changes so every formatted amount and input refreshes.
  return <Outlet key={`${currency}:${rate}`} />;
}
