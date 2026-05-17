import "dotenv/config";

import { asc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { properties, sessions, users } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { verifyPassword } from "@/lib/password";

const DEFAULT_ADMIN_EMAIL = "admin@example.com";

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

async function seedAdmin() {
  const db = getDb();
  const admin = getAdminConfig();
  const userSelection = {
    id: users.id,
    name: users.name,
    email: users.email,
    passwordHash: users.passwordHash,
  };

  const [matchingAdmin] = await db.select(userSelection).from(users).where(eq(users.email, admin.email)).limit(1);
  const [legacyAdmin] = admin.email === DEFAULT_ADMIN_EMAIL
    ? []
    : await db.select(userSelection).from(users).where(eq(users.email, DEFAULT_ADMIN_EMAIL)).limit(1);
  const [firstUser] = await db.select(userSelection).from(users).orderBy(asc(users.createdAt)).limit(1);
  const existingAdmin = matchingAdmin ?? legacyAdmin ?? firstUser;

  if (!existingAdmin) {
    const [createdAdmin] = await db
      .insert(users)
      .values({
        name: admin.name,
        email: admin.email,
        passwordHash: await hashPassword(admin.password),
      })
      .returning({ email: users.email });

    console.log(`Admin created: ${createdAdmin.email}`);
    return;
  }

  const passwordMatches = await verifyPassword(admin.password, existingAdmin.passwordHash);
  const shouldUpdate = existingAdmin.name !== admin.name || existingAdmin.email !== admin.email || !passwordMatches;

  if (!shouldUpdate) {
    console.log(`Admin unchanged: ${existingAdmin.email}`);
    return;
  }

  const [updatedAdmin] = await db
    .update(users)
    .set({
      name: admin.name,
      email: admin.email,
      passwordHash: passwordMatches ? existingAdmin.passwordHash : await hashPassword(admin.password),
      updatedAt: new Date(),
    })
    .where(eq(users.id, existingAdmin.id))
    .returning({ id: users.id, email: users.email });

  await db
    .update(sessions)
    .set({ revokedAt: new Date(), updatedAt: new Date() })
    .where(eq(sessions.userId, updatedAdmin.id));

  console.log(`Admin updated: ${updatedAdmin.email}`);
}

async function seed() {
  const db = getDb();
  await seedAdmin();

  const [existingProperty] = await db
    .select({ id: properties.id })
    .from(properties)
    .where(eq(properties.name, "Homestay Melati"))
    .limit(1);

  if (!existingProperty) {
    await db.insert(properties).values({
      name: "Homestay Melati",
      address: "Jl. Melati No. 18, Yogyakarta",
      description:
        "Rumah keluarga yang disewakan penuh untuk tamu homestay. Cocok untuk keluarga kecil, perjalanan kerja, dan staycation singkat.",
      pricePerNight: "450000.00",
      maxGuests: 6,
      status: "active",
    });
  }

  console.log("Seed completed");
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
