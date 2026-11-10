import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRootRouteWithContext } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { UmamiAnalytics } from '@/components/analytics/umami-analytics';
import { RouteErrorFallback } from '@/components/errors/route-error-fallback';
import { AppShell } from '@/components/layout/app-shell';
import { ThemeFavicon } from '@/components/theme/theme-favicon';
import { DEFAULT_THEME, THEME_IDS } from '@/components/theme/themes';
import { Toaster } from '@/components/ui/sonner';

export type RouterContext = {
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  errorComponent: RouteErrorFallback,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <ThemeProvider
      attribute="data-theme"
      themes={THEME_IDS}
      defaultTheme={DEFAULT_THEME}
      enableSystem={false}
      enableColorScheme={false}
      storageKey="kixvault-colorway"
    >
      <ThemeFavicon />
      <QueryClientProvider client={queryClient}>
        <UmamiAnalytics />
        <AppShell />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

// Outlet is rendered inside AppShell
