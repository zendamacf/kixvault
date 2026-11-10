import { CalendarDays, ChartColumn, LayoutGrid, Star } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { BrandLockup } from '@/components/layout/brand-lockup';
import { ThemeToggle } from '@/components/theme/theme-toggle';

const HIGHLIGHTS = [
  { icon: LayoutGrid, key: 'track' },
  { icon: Star, key: 'grails' },
  { icon: CalendarDays, key: 'wears' },
  { icon: ChartColumn, key: 'charts' },
] as const;

type AuthLayoutProps = {
  children: ReactNode;
};

/** Split layout for sign in and sign up: brand panel on the left, form on the stage. */
export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr] bg-background lg:grid-cols-2 lg:grid-rows-1">
      <aside className="relative overflow-hidden bg-auth-panel px-4 py-4 text-chrome-foreground lg:flex lg:flex-col lg:gap-24 lg:p-12">
        <div className="flex items-start justify-between gap-4">
          <BrandLockup className="h-16 w-auto lg:h-24" />
          <ThemeToggle />
        </div>

        <div className="relative z-10 hidden max-w-md space-y-10 lg:mt-auto lg:block">
          <div className="space-y-4">
            <p className="font-heading text-5xl leading-[1.05] font-semibold tracking-tight">
              {t('layout.auth.headline')}
            </p>
            <p className="text-lg text-chrome-muted">{t('layout.auth.tagline')}</p>
          </div>

          <ul className="space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, key }) => (
              <li key={key} className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="text-chrome-muted">{t(`layout.auth.highlights.${key}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex items-center justify-center px-4 py-12 lg:px-12">{children}</main>
    </div>
  );
}
