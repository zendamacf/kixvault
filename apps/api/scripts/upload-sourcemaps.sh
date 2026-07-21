#!/bin/sh
set -e

if [ -z "$SENTRY_AUTH_TOKEN" ]; then
  echo "Skipping Sentry source map upload (SENTRY_AUTH_TOKEN not set)"
  exit 0
fi

org="kalopsiadev"
project="kixvault-api"
release="${SENTRY_RELEASE:-kixvault-api@local}"

echo "Uploading source maps to ${org}/${project} (release: ${release})"

sentry-cli sourcemaps inject --org "$org" --project "$project" ./dist

sentry-cli releases new "$release" --org "$org" --project "$project" 2>/dev/null || true

if [ -n "$SENTRY_COMMIT_SHA" ] && [ -n "$SENTRY_REPO" ]; then
  if ! sentry-cli releases set-commits "$release" --org "$org" --project "$project" --commit "$SENTRY_REPO@$SENTRY_COMMIT_SHA" --ignore-missing; then
    echo "WARN: Could not associate commits for '$SENTRY_REPO' (ensure the repo is linked in Sentry)"
  fi
fi

sentry-cli sourcemaps upload --org "$org" --project "$project" --release "$release" ./dist

sentry-cli releases finalize "$release" --org "$org" --project "$project"

find ./dist -name '*.map' -delete
