/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __KIXVAULT_RUNTIME_CONFIG__?: {
    umami?: {
      websiteId?: string;
      domain?: string;
      scriptUrl?: string;
    };
  };
  umami?: {
    track: (event?: string | ((props: Record<string, unknown>) => Record<string, unknown>)) => void;
  };
}
