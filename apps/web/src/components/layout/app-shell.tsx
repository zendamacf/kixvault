import { APP_NAME } from '@kixvault/shared';
import { useQuery } from '@tanstack/react-query';
import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { UserMenu } from '@/components/layout/user-menu';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { buttonVariants } from '@/components/ui/button';
import { sessionQueryOptions } from '@/lib/queries';
import { cn } from '@/lib/utils';

/** Root layout with header, main content area, and auth vs. authenticated shells. */
export function AppShell() {
  const routerState = useRouterState();
  const { data } = useQuery(sessionQueryOptions);
  const user = data?.user ?? null;

  const pathname = routerState.location.pathname;

  const isAuthRoute = pathname === '/login' || pathname === '/register';
  const isGrailsRoute = pathname.startsWith('/grails');
  const isCollectionRoute = pathname === '/' || pathname.startsWith('/sneakers');

  if (isAuthRoute) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-accent/40">
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-8">
          <Outlet />
        </div>
      </div>
    );
  }

  const navLinkClass = (active: boolean) =>
    cn(
      'rounded-md px-3 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary',
      active
        ? 'bg-chrome-foreground/12 text-chrome-foreground'
        : 'text-chrome-muted hover:text-chrome-foreground',
    );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-chrome text-chrome-foreground">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex min-w-0 items-center gap-4 sm:gap-8">
            <Link
              to="/"
              className="group flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={`${APP_NAME} home`}
            >
              <span
                aria-hidden
                className="grid size-7 -rotate-6 place-items-center rounded-md bg-primary font-display text-base font-extrabold leading-none text-primary-foreground transition-transform group-hover:rotate-0"
              >
                K
              </span>
              <span className="font-display text-xl font-extrabold tracking-tight">{APP_NAME}</span>
            </Link>
            {user ? (
              <nav className="flex items-center gap-1" aria-label="Main">
                <Link to="/" className={navLinkClass(isCollectionRoute)}>
                  Collection
                </Link>
                <Link to="/grails" className={navLinkClass(isGrailsRoute)}>
                  Grails
                </Link>
              </nav>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            {user ? (
              <>
                <Link
                  to="/sneakers/new"
                  className={buttonVariants({ size: 'default' })}
                  aria-label="Add pair"
                >
                  <Plus className="size-4" aria-hidden />
                  <span className="hidden sm:inline">Add pair</span>
                </Link>
                <UserMenu user={user} />
              </>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
}
