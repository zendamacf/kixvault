import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRootRouteWithContext } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { AppShell } from '@/components/layout/app-shell';
import { Toaster } from '@/components/ui/sonner';

export type RouterContext = {
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="kixvault-theme">
      <QueryClientProvider client={queryClient}>
        <AppShell />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

// Outlet is rendered inside AppShell
