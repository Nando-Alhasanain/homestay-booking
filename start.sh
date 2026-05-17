#!/bin/sh
set -e

node scripts/bootstrap.mjs
exec node server.js
