import "dotenv/config";

import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const DEFAULT_ADMIN_EMAIL = "admin@example.com";

function requiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function getAdminConfig() {
  const isProduction = process.env.NODE_ENV === "production";
  const name = process.env.ADMIN_NAME?.trim() || (isProduction ? "Admin" : "Admin Dewi");
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() || (isProduction ? "" : DEFAULT_ADMIN_EMAIL);
  const password = process.env.ADMIN_PASSWORD || (isProduction ? "" : "password");

  if (isProduction && (!email || !password)) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required in production");
  }

  if (isProduction && password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters in production");
  }

  return { name, email, password };
}

async function runMigrations() {
  const client = postgres(requiredEnv("DATABASE_URL"), { max: 1 });
  const db = drizzle(client);

  try {
    await migrate(db, { migrationsFolder: "src/db/migrations" });
    console.log("Migrations applied");
  } finally {
    await client.end();
  }
}

async function selectUser(sql, email) {
  const rows = await sql`
    select id, name, email, password_hash as "passwordHash"
    from users
    where email = ${email}
    limit 1
  `;

  return rows[0] ?? null;
}

async function selectFirstUser(sql) {
  const rows = await sql`
    select id, name, email, password_hash as "passwordHash"
    from users
    order by created_at asc
    limit 1
  `;

  return rows[0] ?? null;
}

async function seedAdmin(sql) {
  const admin = getAdminConfig();
  const matchingAdmin = await selectUser(sql, admin.email);
  const legacyAdmin = admin.email === DEFAULT_ADMIN_EMAIL ? null : await selectUser(sql, DEFAULT_ADMIN_EMAIL);
  const firstUser = await selectFirstUser(sql);
  const existingAdmin = matchingAdmin ?? legacyAdmin ?? firstUser;

  if (!existingAdmin) {
    await sql`
      insert into users (name, email, password_hash)
      values (${admin.name}, ${admin.email}, ${await bcrypt.hash(admin.password, 12)})
    `;
    console.log(`Admin created: ${admin.email}`);
    return;
  }

  const passwordMatches = await bcrypt.compare(admin.password, existingAdmin.passwordHash);
  const shouldUpdate = existingAdmin.name !== admin.name || existingAdmin.email !== admin.email || !passwordMatches;

  if (!shouldUpdate) {
    console.log(`Admin unchanged: ${existingAdmin.email}`);
    return;
  }

  const passwordHash = passwordMatches ? existingAdmin.passwordHash : await bcrypt.hash(admin.password, 12);

  await sql`
    update users
    set name = ${admin.name}, email = ${admin.email}, password_hash = ${passwordHash}, updated_at = now()
    where id = ${existingAdmin.id}
  `;
  await sql`
    update sessions
    set revoked_at = now(), updated_at = now()
    where user_id = ${existingAdmin.id}
  `;
  console.log(`Admin updated: ${admin.email}`);
}

async function seedProperty(sql) {
  const existingProperties = await sql`
    select id
    from properties
    where name = 'Homestay Melati'
    limit 1
  `;

  if (existingProperties.length > 0) return;

  await sql`
    insert into properties (name, address, description, price_per_night, max_guests, status)
    values (
      'Homestay Melati',
      'Jl. Melati No. 18, Yogyakarta',
      'Rumah keluarga yang disewakan penuh untuk tamu homestay. Cocok untuk keluarga kecil, perjalanan kerja, dan staycation singkat.',
      '450000.00',
      6,
      'active'
    )
  `;
}

async function runSeed() {
  const sql = postgres(requiredEnv("DATABASE_URL"), { max: 1 });

  try {
    await seedAdmin(sql);
    await seedProperty(sql);
    console.log("Seed completed");
  } finally {
    await sql.end();
  }
}

await runMigrations();
await runSeed();
