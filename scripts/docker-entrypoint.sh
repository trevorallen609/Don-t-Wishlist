#!/bin/sh
set -eu

mkdir -p /data
export DATABASE_URL="${DATABASE_URL:-file:/data/app.db}"

echo "Applying Prisma migrations…"
node node_modules/prisma/build/index.js migrate deploy --schema=prisma/schema.prisma

echo "Starting Don’t Wishlist…"
exec node server.js
