#!/bin/sh
set -e

if [ -z "$SENTRY_AUTH_TOKEN" ]; then
  echo "Skipping Sentry source map upload (SENTRY_AUTH_TOKEN not set)"
  exit 0
fi

org="${SENTRY_ORG:-kalopsiadev}"
project="${SENTRY_PROJECT:-kixvault-api}"
release="${SENTRY_RELEASE:-kixvault-api@local}"

echo "Uploading source maps to ${org}/${project} (release: ${release})"

sentry-cli sourcemaps inject --org "$org" --project "$project" ./dist

sentry-cli releases new "$release" --org "$org" --project "$project" 2>/dev/null || true

sentry-cli sourcemaps upload --org "$org" --project "$project" --release "$release" ./dist

sentry-cli releases finalize "$release" --org "$org" --project "$project"
