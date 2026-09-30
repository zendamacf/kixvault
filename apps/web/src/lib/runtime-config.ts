export type UmamiRuntimeConfig = {
  websiteId?: string;
  domain?: string;
  scriptUrl?: string;
};

export type RuntimeConfig = {
  umami?: UmamiRuntimeConfig;
};

const emptyConfig: RuntimeConfig = { umami: {} };

export function getRuntimeConfig(): RuntimeConfig {
  if (typeof window === 'undefined') {
    return emptyConfig;
  }

  return window.__KIXVAULT_RUNTIME_CONFIG__ ?? emptyConfig;
}
