FROM oven/bun:1.3.13

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

ARG SENTRY_AUTH_TOKEN
ARG SENTRY_RELEASE
ENV SENTRY_RELEASE=${SENTRY_RELEASE}

RUN bun run --cwd apps/api build:release

COPY apps/api/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
