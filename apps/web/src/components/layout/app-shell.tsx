import { APP_NAME } from "@kixvault/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, parseApiError } from "@/lib/api";
import { sessionQueryOptions } from "@/lib/queries";

export function AppShell() {
  const routerState = useRouterState();
  const queryClient = useQueryClient();
  const { data } = useQuery(sessionQueryOptions);
  const user = data?.user ?? null;

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await api.api.auth.logout.$post();

      if (!response.ok) {
        throw new Error(await parseApiError(response, "Failed to log out"));
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth"] });
      await queryClient.clear();
      window.location.href = "/login";
    },
  });

  const isAuthRoute =
    routerState.location.pathname === "/login" || routerState.location.pathname === "/register";

  if (isAuthRoute) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <Link to="/" className="text-lg font-semibold tracking-tight">
              {APP_NAME}
            </Link>
            {user ? <p className="text-sm text-muted-foreground">{user.email}</p> : null}
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  to="/sneakers/new"
                  className="inline-flex h-8 items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-xs font-medium transition-colors hover:bg-accent"
                >
                  <Plus className="size-4" />
                  Add pair
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="size-4" />
                  Log out
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
