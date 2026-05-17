import "dotenv/config";

import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { properties, users } from "@/db/schema";
import { hashPassword } from "@/lib/password";

async function seed() {
  const db = getDb();

  const [existingAdmin] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, "admin@example.com"))
    .limit(1);

  if (!existingAdmin) {
    await db.insert(users).values({
      name: "Admin Dewi",
      email: "admin@example.com",
      passwordHash: await hashPassword("password"),
    });
  }

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

  console.log("Seed completed: admin@example.com / password");
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
