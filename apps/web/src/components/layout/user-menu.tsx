import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { History, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api, parseApiError } from '@/lib/api';
import type { AuthUser } from '@/lib/queries';
import { trackUmamiEvent } from '@/lib/umami';
import { UmamiEvents } from '@/lib/umami-events';
import { cn } from '@/lib/utils';

function getInitials(email: string): string {
  const [localPart] = email.split('@');
  const parts = localPart.split(/[._-]+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }

  return (localPart.slice(0, 2) || 'KV').toUpperCase();
}

type UserMenuProps = {
  user: AuthUser;
};

/** Profile avatar with account actions in the top bar. */
export function UserMenu({ user }: UserMenuProps) {
  const queryClient = useQueryClient();
  const initials = getInitials(user.email);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await api.api.auth.logout.$post();

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to log out'));
      }
    },
    onSuccess: async () => {
      trackUmamiEvent(UmamiEvents.authLogout);
      await queryClient.invalidateQueries({ queryKey: ['auth'] });
      await queryClient.clear();
      window.location.href = '/login';
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        className={cn(
          'inline-flex size-9 items-center justify-center rounded-full border border-border bg-accent text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
        aria-label="Account menu"
      >
        {initials}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium leading-none">Account</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/activity" className="cursor-pointer">
            <History className="size-4" />
            Activity
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
