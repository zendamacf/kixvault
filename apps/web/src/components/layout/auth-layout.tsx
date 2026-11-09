import { APP_NAME } from '@kixvault/shared';
import type { ReactNode } from 'react';
import { BrandMark } from '@/components/layout/brand-mark';

type AuthLayoutProps = {
  children: ReactNode;
};

/** Split layout for sign in and sign up: brand panel on the left, form on the stage. */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr] bg-background lg:grid-cols-2 lg:grid-rows-1">
      <aside className="relative overflow-hidden bg-chrome px-4 py-4 text-chrome-foreground lg:flex lg:flex-col lg:gap-24 lg:p-12">
        <div className="flex items-center gap-2.5">
          <BrandMark />
          <span className="font-heading text-xl font-extrabold tracking-tight">{APP_NAME}</span>
        </div>

        <div className="relative z-10 hidden max-w-md space-y-4 lg:block">
          <p className="font-heading text-5xl leading-[1.05] font-semibold tracking-tight">
            Every pair, what you paid, and what it is worth.
          </p>
          <p className="text-lg text-chrome-muted">Built for sneaker collectors.</p>
        </div>

        {/* The logo shoe without its tile, so it sits straight on the panel. */}
        <BrandMark
          bare
          className="pointer-events-none absolute -right-4 -bottom-6 hidden w-[30rem] lg:block"
        />
      </aside>

      <main className="flex items-center justify-center px-4 py-12 lg:px-12">{children}</main>
    </div>
  );
}
