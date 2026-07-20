# syntax=docker/dockerfile:1

FROM oven/bun:1.3.13 AS build

WORKDIR /app

COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/

RUN bun install --frozen-lockfile

COPY packages/shared packages/shared
COPY packages/db packages/db
COPY apps/api apps/api
COPY tsconfig.base.json tsconfig.json ./

RUN bun run --cwd packages/shared build && bun run --cwd packages/db build

# sentry-cli uses the system OpenSSL CA store (Bun's bundled CAs are not enough)
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*
ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt

ARG SENTRY_RELEASE
ARG SENTRY_COMMIT_SHA
ARG SENTRY_REPO

RUN --mount=type=secret,id=sentry_auth_token \
    SENTRY_AUTH_TOKEN="$(cat /run/secrets/sentry_auth_token)" \
    SENTRY_RELEASE=$SENTRY_RELEASE \
    SENTRY_COMMIT_SHA=$SENTRY_COMMIT_SHA SENTRY_REPO=$SENTRY_REPO \
    bun run --cwd apps/api build:release

FROM oven/bun:1.3.13

WORKDIR /app

COPY --from=build /app/packages/db packages/db
COPY --from=build /app/packages/shared packages/shared
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/node_modules apps/api/node_modules
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/package.json package.json
COPY --from=build /app/apps/api/package.json apps/api/package.json

COPY apps/api/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ARG SENTRY_RELEASE
ENV SENTRY_RELEASE=${SENTRY_RELEASE}
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]