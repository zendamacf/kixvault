const UMAMI_SCRIPT_PATH = '/script.js';

export function getUmamiWebsiteId(): string | undefined {
  const id = import.meta.env.VITE_UMAMI_WEBSITE_ID?.trim();
  return id ? id : undefined;
}

/** Full script URL when set; otherwise derived from {@link getUmamiDomain}. */
export function getUmamiScriptUrl(): string | undefined {
  const scriptUrl = import.meta.env.VITE_UMAMI_SCRIPT_URL?.trim();
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
  const domain = import.meta.env.VITE_UMAMI_DOMAIN?.trim();
  if (!domain) {
    return undefined;
  }

  return domain.replace(/\/+$/, '');
}

export function isUmamiConfigured(): boolean {
  return Boolean(getUmamiWebsiteId() && getUmamiScriptUrl());
}

export function shouldRespectDoNotTrack(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const dnt = navigator.doNotTrack;
  const gpc = (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl;

  return dnt === '1' || dnt === 'yes' || gpc === true;
}

export function isUmamiEnabled(): boolean {
  return isUmamiConfigured() && !shouldRespectDoNotTrack();
}

export function trackUmamiPageview(): void {
  if (!isUmamiEnabled() || typeof window === 'undefined') {
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
  if (!isUmamiEnabled() || typeof document === 'undefined') {
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
