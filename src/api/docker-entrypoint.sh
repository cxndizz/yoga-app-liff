#!/bin/sh
set -euo pipefail

if [ "${DB_WAIT_SKIP:-false}" != "true" ]; then
  echo "Waiting for database to become ready..."
  node src/scripts/wait-for-db.js
fi

echo "Running admin user seed..."
npm run seed:admin

echo "Starting API server..."
exec npm start
