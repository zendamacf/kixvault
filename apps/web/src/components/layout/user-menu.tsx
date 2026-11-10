import { Link } from '@tanstack/react-router';
import { History, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { AuthUser } from '@/lib/queries';
import { useLogout } from '@/lib/use-logout';
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
  const { t } = useTranslation();
  const initials = getInitials(user.email);
  const logoutMutation = useLogout();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        className={cn(
          'inline-flex size-9 items-center justify-center rounded-full border border-chrome-foreground/25 bg-chrome-foreground/10 font-heading text-sm font-bold text-chrome-foreground transition-colors hover:bg-chrome-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        )}
        aria-label={t('layout.userMenu.trigger')}
      >
        {initials}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium leading-none">{t('layout.userMenu.account')}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/activity" className="cursor-pointer">
            <History className="size-4" />
            {t('layout.nav.activity')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="size-4" />
          {t('layout.userMenu.logOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
