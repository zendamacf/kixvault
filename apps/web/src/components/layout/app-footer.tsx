import { APP_NAME } from '@kixvault/shared';

const GITHUB_URL = 'https://github.com/zendamacf/kixvault';

/** Site footer with a link to the GitHub repository and the running app version. */
export function AppFooter() {
  const version = import.meta.env.VITE_APP_VERSION;

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 text-sm text-muted-foreground">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="rounded-md outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
        >
          {APP_NAME} on GitHub
        </a>
        {version ? <span>v{version}</span> : null}
      </div>
    </footer>
  );
}
