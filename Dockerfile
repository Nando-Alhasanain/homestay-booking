# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base
WORKDIR /app

FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max-old-space-size=1536
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --prefer-offline --no-audit --fund=false
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN apk add --no-cache su-exec \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs \
  && mkdir -p /app/storage/invoices \
  && chown -R nextjs:nodejs /app/storage

COPY --chown=nextjs:nodejs --from=builder /app/public ./public
COPY --chown=nextjs:nodejs --from=builder /app/.next/standalone ./
COPY --chown=nextjs:nodejs --from=builder /app/.next/static ./.next/static
COPY --chown=nextjs:nodejs --from=builder /app/package.json ./package.json
COPY --chown=nextjs:nodejs --from=builder /app/package-lock.json ./package-lock.json
COPY --chown=nextjs:nodejs --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --chown=nextjs:nodejs --from=builder /app/node_modules/postgres ./node_modules/postgres
COPY --chown=nextjs:nodejs --from=builder /app/scripts ./scripts
COPY --chown=nextjs:nodejs --from=builder /app/start.sh ./start.sh

RUN chmod +x /app/start.sh

EXPOSE 3000

CMD ["./start.sh"]
