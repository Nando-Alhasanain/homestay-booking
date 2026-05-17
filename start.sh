#!/bin/sh
set -e

npx drizzle-kit migrate
node server.js
