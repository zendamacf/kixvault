#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is required"
  exit 1
fi

echo "Waiting for database..."
until bun -e "
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
await sql\`select 1\`;
await sql.end();
" >/dev/null 2>&1; do
  sleep 2
done

echo "Running migrations..."
bun run --cwd packages/db db:migrate

echo "Starting API..."
exec bun run --cwd apps/api src/index.ts
