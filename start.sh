#!/bin/sh
set -e

mkdir -p /app/storage/invoices
chown -R nextjs:nodejs /app/storage

su-exec nextjs node scripts/bootstrap.mjs
exec su-exec nextjs node server.js
