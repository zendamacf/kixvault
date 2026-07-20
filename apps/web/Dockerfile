# syntax=docker/dockerfile:1

FROM oven/bun:1.3.13 AS build

WORKDIR /app

COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/

RUN bun install --frozen-lockfile

COPY packages/shared packages/shared
COPY packages/db packages/db
COPY apps/api apps/api
COPY apps/web apps/web
COPY biome.json tsconfig.base.json ./

# sentry-cli uses the system OpenSSL CA store (Bun's bundled CAs are not enough)
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*
ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt

ARG VITE_APP_VERSION

ENV VITE_APP_VERSION=${VITE_APP_VERSION}

WORKDIR /app/apps/web
RUN --mount=type=secret,id=sentry_auth_token \
    SENTRY_AUTH_TOKEN="$(cat /run/secrets/sentry_auth_token)" \
    bun run build

FROM nginx:1.27-alpine

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80
