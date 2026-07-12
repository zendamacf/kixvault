#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE=".env.ci-smoke"
COMPOSE=(docker compose --env-file "$ENV_FILE")
attempts="${SMOKE_ATTEMPTS:-60}"
sleep_seconds="${SMOKE_SLEEP_SECONDS:-5}"
base_url="${SMOKE_BASE_URL:-http://127.0.0.1}"

cleanup() {
  "${COMPOSE[@]}" down -v --remove-orphans >/dev/null 2>&1 || true
  rm -f "$ENV_FILE"
}

trap cleanup EXIT

cat > "$ENV_FILE" <<'EOF'
POSTGRES_USER=kixvault
POSTGRES_PASSWORD=ci-smoke-test-password
POSTGRES_DB=kixvault
DOMAIN=localhost
ACME_EMAIL=
KICKSDB_API_KEY=KICKS-xxxx-xxxx-xxxx-xxxxxxxxxxxx
EOF

echo "Building Docker Compose stack..."
"${COMPOSE[@]}" build

echo "Starting services..."
"${COMPOSE[@]}" up -d

for attempt in $(seq 1 "$attempts"); do
  caddy_status="$("${COMPOSE[@]}" ps caddy --format '{{.Status}}' 2>/dev/null || true)"

  if [[ "$caddy_status" == Restarting* ]]; then
    echo "Waiting for services (${attempt}/${attempts}): Caddy is restarting..."
    sleep "$sleep_seconds"
    continue
  fi

  if curl -fsS "${base_url}/api/health" >/tmp/kixvault-smoke-health.json \
    && curl -fsS "${base_url}/" >/tmp/kixvault-smoke-web.html; then
    echo "Smoke checks passed on attempt ${attempt}/${attempts}"
    cat /tmp/kixvault-smoke-health.json
    exit 0
  fi

  echo "Waiting for services (${attempt}/${attempts})..."
  sleep "$sleep_seconds"
done

echo "Services did not become ready in time."
"${COMPOSE[@]}" ps
"${COMPOSE[@]}" logs db api web caddy
exit 1
