import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
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
  component: () => <Outlet />,
});
