import bcrypt from "bcryptjs";
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
  const sql = postgres(requiredEnv("DATABASE_URL"), { max: 1 });
  const statements = [
    `CREATE TABLE IF NOT EXISTS "users" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "name" varchar(100) NOT NULL,
      "email" varchar(255) NOT NULL,
      "password_hash" text NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique_idx" ON "users" ("email")`,
    `CREATE TABLE IF NOT EXISTS "properties" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "name" varchar(150) NOT NULL,
      "address" text,
      "description" text,
      "price_per_night" numeric(12, 2) NOT NULL,
      "max_guests" integer NOT NULL,
      "status" varchar(30) DEFAULT 'active' NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    )`,
    `ALTER TABLE "properties" DROP COLUMN IF EXISTS "photo_url"`,
    `CREATE TABLE IF NOT EXISTS "bookings" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "property_id" uuid NOT NULL,
      "guest_name" varchar(150) NOT NULL,
      "guest_phone" varchar(50) NOT NULL,
      "guest_email" varchar(255),
      "check_in" date NOT NULL,
      "check_out" date NOT NULL,
      "guest_count" integer NOT NULL,
      "price_per_night" numeric(12, 2) NOT NULL,
      "total_nights" integer NOT NULL,
      "subtotal" numeric(12, 2) NOT NULL,
      "additional_fees" numeric(12, 2) DEFAULT '0' NOT NULL,
      "discount" numeric(12, 2) DEFAULT '0' NOT NULL,
      "total_price" numeric(12, 2) NOT NULL,
      "paid_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
      "remaining_amount" numeric(12, 2) NOT NULL,
      "payment_method" varchar(50),
      "booking_status" varchar(50) DEFAULT 'pending' NOT NULL,
      "payment_status" varchar(50) DEFAULT 'unpaid' NOT NULL,
      "notes" text,
      "created_by" uuid,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "invoices" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "booking_id" uuid NOT NULL,
      "invoice_number" varchar(100) NOT NULL,
      "invoice_date" date NOT NULL,
      "pdf_url" text,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "invoices_invoice_number_unique_idx" ON "invoices" ("invoice_number")`,
    `CREATE TABLE IF NOT EXISTS "sessions" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "user_id" uuid NOT NULL,
      "user_agent" text,
      "ip_address" varchar(100),
      "expires_at" timestamp NOT NULL,
      "revoked_at" timestamp,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions" ("user_id")`,
    `CREATE INDEX IF NOT EXISTS "sessions_expires_at_idx" ON "sessions" ("expires_at")`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_property_id_properties_id_fk') THEN
        ALTER TABLE "bookings" ADD CONSTRAINT "bookings_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE no action ON UPDATE no action;
      END IF;
    END $$`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_created_by_users_id_fk') THEN
        ALTER TABLE "bookings" ADD CONSTRAINT "bookings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
      END IF;
    END $$`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_booking_id_bookings_id_fk') THEN
        ALTER TABLE "invoices" ADD CONSTRAINT "invoices_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE no action ON UPDATE no action;
      END IF;
    END $$`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_user_id_users_id_fk') THEN
        ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$`,
  ];

  try {
    for (const statement of statements) {
      await sql.unsafe(statement);
    }
    console.log("Migrations applied");
  } finally {
    await sql.end();
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
