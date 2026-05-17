# Coolify Deployment

## Required Environment Variables

```env
NODE_ENV=production
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME
JWT_SECRET=replace-with-at-least-32-random-bytes
JWT_EXPIRES_IN=7d
NEXT_PUBLIC_APP_URL=https://your-domain.com
INVOICE_STORAGE_PATH=/app/storage/invoices
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-strong-admin-password
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

The container runs migrations and admin seed automatically on startup. To change the admin account later, update `ADMIN_EMAIL` and/or `ADMIN_PASSWORD` in Coolify, then redeploy or restart the app.

`ADMIN_PASSWORD` must be at least 12 characters in production.

## Notes

- The container runs database migrations and admin seed on startup through a production JavaScript bootstrap script before `node server.js`.
- When admin email/password changes through env, existing sessions are revoked and you must log in again.
- Invoice PDFs are stored on disk, so `/app/storage/invoices` must be persistent.
- Login rate limiting is in-memory. Use one running app instance, or replace it with Redis-backed rate limiting before scaling horizontally.
