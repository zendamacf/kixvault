import { getRuntimeConfig } from '@/lib/runtime-config';

const UMAMI_SCRIPT_PATH = '/script.js';

function getUmamiConfig() {
  return getRuntimeConfig().umami ?? {};
}

export function getUmamiWebsiteId(): string | undefined {
  const id = getUmamiConfig().websiteId?.trim();
  return id ? id : undefined;
}

/** Full script URL when set; otherwise derived from {@link getUmamiDomain}. */
export function getUmamiScriptUrl(): string | undefined {
  const scriptUrl = getUmamiConfig().scriptUrl?.trim();
  if (scriptUrl) {
    return scriptUrl;
  }

  const domain = getUmamiDomain();
  if (!domain) {
    return undefined;
  }

  return `${domain}${UMAMI_SCRIPT_PATH}`;
}

/** Self-hosted or cloud Umami origin (no trailing slash), e.g. `https://analytics.example.com`. */
export function getUmamiDomain(): string | undefined {
  const domain = getUmamiConfig().domain?.trim();
  if (!domain) {
    return undefined;
  }

  return domain.replace(/\/+$/, '');
}

export function isUmamiConfigured(): boolean {
  return Boolean(getUmamiWebsiteId() && getUmamiScriptUrl());
}

export function trackUmamiPageview(): void {
  if (!isUmamiConfigured() || typeof window === 'undefined') {
    return;
  }

  const url = `${window.location.pathname}${window.location.search}`;

  window.umami?.track((props) => ({
    ...props,
    url,
  }));
}

let scriptLoadPromise: Promise<void> | null = null;

export function ensureUmamiScript(): Promise<void> {
  if (!isUmamiConfigured() || typeof document === 'undefined') {
    return Promise.resolve();
  }

  const websiteId = getUmamiWebsiteId();
  const scriptUrl = getUmamiScriptUrl();
  if (!websiteId || !scriptUrl) {
    return Promise.resolve();
  }

  const existing = document.querySelector(`script[data-website-id="${websiteId}"]`);
  if (existing) {
    return Promise.resolve();
  }

  if (!scriptLoadPromise) {
    scriptLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.defer = true;
      script.src = scriptUrl;
      script.setAttribute('data-website-id', websiteId);
      script.setAttribute('data-auto-track', 'false');
      script.onload = () => resolve();
      script.onerror = () => {
        scriptLoadPromise = null;
        reject(new Error('Failed to load Umami analytics script'));
      };
      document.head.appendChild(script);
    });
  }

  return scriptLoadPromise;
}
