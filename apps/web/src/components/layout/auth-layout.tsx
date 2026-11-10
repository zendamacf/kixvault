import { CalendarDays, LayoutGrid, Star } from 'lucide-react';
import type { ReactNode } from 'react';
import { BrandLockup } from '@/components/layout/brand-lockup';

const HIGHLIGHTS = [
  { icon: LayoutGrid, text: 'Track what you paid and what each pair is worth' },
  { icon: Star, text: 'Keep a grails list of the pairs you are chasing' },
  { icon: CalendarDays, text: 'Log every wear and see what actually gets worn' },
] as const;

type AuthLayoutProps = {
  children: ReactNode;
};

/** Split layout for sign in and sign up: brand panel on the left, form on the stage. */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr] bg-background lg:grid-cols-2 lg:grid-rows-1">
      <aside className="relative overflow-hidden bg-auth-panel px-4 py-4 text-chrome-foreground lg:flex lg:flex-col lg:gap-24 lg:p-12">
        <BrandLockup className="h-16 w-auto lg:h-24" />

        <div className="relative z-10 hidden max-w-md space-y-10 lg:mt-auto lg:block">
          <div className="space-y-4">
            <p className="font-heading text-5xl leading-[1.05] font-semibold tracking-tight">
              Every pair, what you paid, and what it is worth.
            </p>
            <p className="text-lg text-chrome-muted">Built for sneaker collectors.</p>
          </div>

          <ul className="space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="text-chrome-muted">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex items-center justify-center px-4 py-12 lg:px-12">{children}</main>
    </div>
  );
}
