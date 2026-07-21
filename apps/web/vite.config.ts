import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    sourcemap: process.env.SENTRY_AUTH_TOKEN ? 'hidden' : false,
  },
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
    ...(process.env.SENTRY_AUTH_TOKEN
      ? [
          sentryVitePlugin({
            org: 'kalopsiadev',
            project: 'kixvault-web',
            authToken: process.env.SENTRY_AUTH_TOKEN,
            release: {
              name: process.env.VITE_APP_VERSION,
              setCommits:
                process.env.SENTRY_COMMIT_SHA && process.env.SENTRY_REPO
                  ? {
                      auto: false,
                      repo: process.env.SENTRY_REPO,
                      commit: process.env.SENTRY_COMMIT_SHA,
                      ignoreMissing: true,
                    }
                  : false,
            },
            sourcemaps: {
              filesToDeleteAfterUpload: '**/*.map',
            },
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
      '@kixvault/shared': path.resolve(rootDir, '../../packages/shared/src/index.ts'),
      '@kixvault/api/app': path.resolve(rootDir, '../api/src/app.ts'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
