import { APP_NAME } from '@kixvault/shared';
import { useQuery } from '@tanstack/react-query';
import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { Footprints, Plus } from 'lucide-react';
import { useState } from 'react';
import { AppFooter } from '@/components/layout/app-footer';
import { AuthLayout } from '@/components/layout/auth-layout';
import { BrandLockup } from '@/components/layout/brand-lockup';
import { MobileMenu } from '@/components/layout/mobile-menu';
import { UserMenu } from '@/components/layout/user-menu';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Button, buttonVariants } from '@/components/ui/button';
import { QuickLogDialog } from '@/components/wears/quick-log-dialog';
import { sessionQueryOptions } from '@/lib/queries';
import { cn } from '@/lib/utils';

/** Pages shown inside the signed-out brand layout. */
const AUTH_PATHS = new Set(['/login', '/register', '/verify-email', '/verify-email-pending']);

/** Root layout with header, main content area, and auth vs. authenticated shells. */
export function AppShell() {
  const routerState = useRouterState();
  const { data } = useQuery(sessionQueryOptions);
  const user = data?.user ?? null;
  const [quickLogOpen, setQuickLogOpen] = useState(false);

  const pathname = routerState.location.pathname;

  const isAuthRoute = AUTH_PATHS.has(pathname);
  const isGrailsRoute = pathname.startsWith('/grails');
  const isWearsRoute = pathname.startsWith('/wears');
  const isCollectionRoute = pathname === '/' || pathname.startsWith('/sneakers');

  if (isAuthRoute) {
    return (
      <AuthLayout>
        <Outlet />
      </AuthLayout>
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
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-2 focus-visible:left-4 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-primary focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:font-semibold focus-visible:text-primary-foreground"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-10 bg-chrome text-chrome-foreground">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex min-w-0 items-center gap-1 sm:gap-3 md:gap-8">
            {user ? <MobileMenu user={user} pathname={pathname} /> : null}
            <Link
              to="/"
              className="group flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={`${APP_NAME} home`}
            >
              <BrandLockup className="h-9 w-auto" />
            </Link>
            {user ? (
              <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
                <Link to="/" className={navLinkClass(isCollectionRoute)}>
                  Collection
                </Link>
                <Link to="/grails" className={navLinkClass(isGrailsRoute)}>
                  Grails
                </Link>
                <Link to="/wears" className={navLinkClass(isWearsRoute)}>
                  Wears
                </Link>
              </nav>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
            {user ? (
              <>
                <Button
                  variant="outline"
                  className="border-chrome-foreground/25 bg-transparent text-chrome-foreground hover:bg-chrome-foreground/12 hover:text-chrome-foreground dark:bg-transparent"
                  aria-label="Log wear"
                  onClick={() => setQuickLogOpen(true)}
                >
                  <Footprints className="size-4" aria-hidden />
                  <span className="hidden sm:inline">Log wear</span>
                </Button>
                <Link
                  to="/sneakers/new"
                  className={buttonVariants({ size: 'default' })}
                  aria-label="Add pair"
                >
                  <Plus className="size-4" aria-hidden />
                  <span className="hidden sm:inline">Add pair</span>
                </Link>
                <div className="hidden md:block">
                  <UserMenu user={user} />
                </div>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 outline-none sm:py-10"
      >
        <Outlet />
      </main>

      <AppFooter />
      {user ? <QuickLogDialog open={quickLogOpen} onOpenChange={setQuickLogOpen} /> : null}
    </div>
  );
}
