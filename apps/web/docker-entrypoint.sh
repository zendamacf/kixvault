#!/bin/sh
set -eu

escape_js() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

WEBSITE_ID=$(escape_js "${UMAMI_WEBSITE_ID:-}")
DOMAIN=$(escape_js "${UMAMI_DOMAIN:-}")
SCRIPT_URL=$(escape_js "${UMAMI_SCRIPT_URL:-}")

cat > /usr/share/nginx/html/runtime-config.js <<EOF
window.__KIXVAULT_RUNTIME_CONFIG__ = {
  umami: {
    websiteId: "${WEBSITE_ID}",
    domain: "${DOMAIN}",
    scriptUrl: "${SCRIPT_URL}",
  },
};
EOF

exec nginx -g 'daemon off;'
