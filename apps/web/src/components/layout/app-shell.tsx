import { APP_NAME } from '@kixvault/shared';
import { useQuery } from '@tanstack/react-query';
import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { UserMenu } from '@/components/layout/user-menu';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { sessionQueryOptions } from '@/lib/queries';

/** Root layout with header, main content area, and auth vs. authenticated shells. */
export function AppShell() {
  const routerState = useRouterState();
  const { data } = useQuery(sessionQueryOptions);
  const user = data?.user ?? null;

  const isAuthRoute =
    routerState.location.pathname === '/login' || routerState.location.pathname === '/register';

  if (isAuthRoute) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-accent/40">
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-8">
          <Outlet />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:py-4">
          <div className="min-w-0">
            <Link to="/" className="text-lg font-semibold tracking-tight">
              {APP_NAME}
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            {user ? (
              <>
                <Link
                  to="/sneakers/new"
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-xs font-medium transition-colors hover:bg-accent sm:h-8"
                >
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">Add pair</span>
                </Link>
                <UserMenu user={user} />
              </>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
