#!/bin/sh
set -e

echo "====================================="
echo "Starting NeedHome API Server"
echo "====================================="

# Wait for database
if [ "${DB_WAIT_SKIP:-false}" != "true" ]; then
  echo "⏳ Waiting for database to become ready..."
  node src/scripts/wait-for-db.js
  echo "✅ Database is ready"
fi

# Run DB migration
echo "📦 Running database migrations..."
node src/scripts/runMigration.js
echo "✅ Migration completed"

# Seed admin user
echo "🌱 Running admin user seed..."
npm run seed:admin

# Start the server
echo "🚀 Starting API server on port ${PORT:-4000}..."
exec npm start
