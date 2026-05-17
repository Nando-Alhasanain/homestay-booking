# Coolify Deployment

## Required Environment Variables

```env
NODE_ENV=production
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME
JWT_SECRET=replace-with-at-least-32-random-bytes
JWT_EXPIRES_IN=7d
NEXT_PUBLIC_APP_URL=https://your-domain.com
INVOICE_STORAGE_PATH=/app/storage/invoices
```

Generate `JWT_SECRET` with:

```bash
openssl rand -base64 32
```

## Coolify Setup

1. Create a PostgreSQL resource in Coolify.
2. Create an application from this repository.
3. Use Dockerfile build mode.
4. Set the environment variables above.
5. Add persistent storage mounted to `/app/storage/invoices`.
6. Deploy the application.
7. Run the seed command once from the container shell if needed:

```bash
npm run db:seed
```

Default seeded admin:

```text
admin@example.com
password
```

Change the admin password before using the app in production.

## Notes

- The container runs database migrations on startup before `node server.js`.
- Invoice PDFs are stored on disk, so `/app/storage/invoices` must be persistent.
- Login rate limiting is in-memory. Use one running app instance, or replace it with Redis-backed rate limiting before scaling horizontally.
