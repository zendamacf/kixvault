import * as Sentry from '@sentry/react';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useEffect } from 'react';
import { sessionQueryOptions } from '@/lib/queries';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions);

    if (!session.user) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      });
    }

    return { user: session.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext();

  useEffect(() => {
    Sentry.setUser({ id: user.id });

    return () => {
      Sentry.setUser(null);
    };
  }, [user.id]);

  return <Outlet />;
}
