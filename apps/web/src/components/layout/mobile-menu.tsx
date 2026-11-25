import { Link } from '@tanstack/react-router';
import {
  Archive,
  CalendarDays,
  ChartColumn,
  ChevronDown,
  History,
  LayoutGrid,
  LogOut,
  Menu,
  Palette,
  Settings,
  Star,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMode } from '@/components/theme/mode';
import { ThemeSwatch } from '@/components/theme/theme-swatch';
import { DEFAULT_THEME, MODE_PREFERENCES, THEME_IDS, THEMES } from '@/components/theme/themes';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { AuthUser } from '@/lib/queries';
import { useLogout } from '@/lib/use-logout';
import { cn } from '@/lib/utils';

type MobileMenuProps = {
  user: AuthUser;
  pathname: string;
};

const itemClass =
  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring';

/** Side menu for small screens: main navigation, colorway, activity, and log out. */
export function MobileMenu({ user, pathname }: MobileMenuProps) {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { mode, setMode } = useMode();
  const logout = useLogout();
  const [colorwayOpen, setColorwayOpen] = useState(false);
  const activeTheme = theme && THEME_IDS.includes(theme) ? theme : DEFAULT_THEME;

  const navItems = [
    {
      to: '/',
      label: t('layout.nav.collection'),
      icon: LayoutGrid,
      active: pathname === '/' || pathname.startsWith('/sneakers'),
    },
    {
      to: '/grails',
      label: t('layout.nav.grails'),
      icon: Star,
      active: pathname.startsWith('/grails'),
    },
    {
      to: '/wears',
      label: t('layout.nav.wears'),
      icon: CalendarDays,
      active: pathname.startsWith('/wears'),
    },
    {
      to: '/analytics',
      label: t('layout.nav.analytics'),
      icon: ChartColumn,
      active: pathname.startsWith('/analytics'),
    },
    {
      to: '/history',
      label: t('layout.nav.history'),
      icon: Archive,
      active: pathname.startsWith('/history'),
    },
  ] as const;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('layout.mobileMenu.open')}
          className="text-chrome-foreground hover:bg-chrome-foreground/10 hover:text-chrome-foreground focus-visible:ring-brand md:hidden dark:hover:bg-chrome-foreground/10"
        >
          <Menu aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent aria-describedby="mobile-menu-description">
        <div className="border-b border-border px-5 pt-5 pb-4 pr-14">
          {/* Dialogs need a name for screen readers. Sighted users see the account email instead. */}
          <SheetTitle className="sr-only">{t('layout.mobileMenu.title')}</SheetTitle>
          <SheetDescription id="mobile-menu-description" className="truncate text-foreground">
            {user.email}
          </SheetDescription>
        </div>

        <nav
          aria-label={t('layout.siteMenuLabel')}
          className="flex-1 space-y-1 overflow-y-auto p-3"
        >
          {navItems.map((item) => (
            <SheetClose key={item.to} asChild>
              <Link
                to={item.to}
                aria-current={item.active ? 'page' : undefined}
                className={cn(itemClass, item.active && 'bg-muted')}
              >
                <item.icon className="size-4 text-muted-foreground" aria-hidden />
                {item.label}
              </Link>
            </SheetClose>
          ))}

          <div className="my-2 border-t border-border" />

          <button
            type="button"
            className={itemClass}
            aria-expanded={colorwayOpen}
            aria-controls="mobile-menu-colorway"
            onClick={() => setColorwayOpen((open) => !open)}
          >
            <Palette className="size-4 text-muted-foreground" aria-hidden />
            {t('layout.mobileMenu.colorway')}
            <ChevronDown
              className={cn(
                'ml-auto size-4 text-muted-foreground transition-transform',
                colorwayOpen && 'rotate-180',
              )}
              aria-hidden
            />
          </button>
          {colorwayOpen ? (
            <>
              <fieldset className="m-0 flex min-w-0 gap-1 border-0 p-0 pb-1 pl-4">
                <legend className="sr-only">{t('theme.mode.label')}</legend>
                {MODE_PREFERENCES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={item === mode}
                    onClick={() => setMode(item)}
                    className={cn(
                      'flex-1 rounded-lg px-2 py-1.5 text-center text-sm outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring',
                      item === mode && 'bg-muted font-medium',
                    )}
                  >
                    {t(`theme.mode.${item}`)}
                  </button>
                ))}
              </fieldset>
              <fieldset
                id="mobile-menu-colorway"
                className="m-0 min-w-0 space-y-1 border-0 p-0 pb-1 pl-4"
              >
                <legend className="sr-only">{t('layout.mobileMenu.colorway')}</legend>
                {THEMES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={item.id === activeTheme}
                    onClick={() => setTheme(item.id)}
                    className={cn(
                      'flex w-full flex-col gap-1.5 rounded-lg px-3 py-2 text-left text-sm outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring',
                      item.id === activeTheme && 'bg-muted font-medium',
                    )}
                  >
                    {t(`theme.names.${item.id}`)}
                    <ThemeSwatch id={item.id} />
                  </button>
                ))}
              </fieldset>
            </>
          ) : null}

          <SheetClose asChild>
            <Link to="/activity" className={itemClass}>
              <History className="size-4 text-muted-foreground" aria-hidden />
              {t('layout.nav.activity')}
            </Link>
          </SheetClose>

          <SheetClose asChild>
            <Link to="/settings" className={itemClass}>
              <Settings className="size-4 text-muted-foreground" aria-hidden />
              {t('layout.nav.settings')}
            </Link>
          </SheetClose>
        </nav>

        <div className="border-t border-border p-3">
          <button
            type="button"
            className={cn(itemClass, 'text-destructive hover:bg-destructive/10')}
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
          >
            <LogOut className="size-4" aria-hidden />
            {t('layout.mobileMenu.logOut')}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
