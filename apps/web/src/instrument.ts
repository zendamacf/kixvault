import * as Sentry from '@sentry/react';
import { router } from './router';

Sentry.init({
  dsn: 'https://6e3aa0cdc88bc76d3b99373c6a95161b@o4509541345591296.ingest.de.sentry.io/4511732843544656',
  environment: import.meta.env.MODE,
  release: import.meta.env.VITE_APP_VERSION,

  sendDefaultPii: true,

  integrations: [
    Sentry.tanstackRouterBrowserTracingIntegration(router),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
  tracePropagationTargets: ['localhost', /^\//],

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  enableLogs: true,
});
