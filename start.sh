#!/bin/sh
set -e

npx drizzle-kit migrate
npm run db:seed
node server.js
