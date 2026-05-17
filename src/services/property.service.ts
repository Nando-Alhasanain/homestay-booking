import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { properties } from "@/db/schema";
import { ApiError } from "@/lib/api-response";
import type { CreatePropertyInput, UpdatePropertyInput } from "@/validators/property.validator";

function toMoney(value: number) {
  return value.toFixed(2);
}

export async function listProperties() {
  return getDb().select().from(properties).orderBy(properties.createdAt);
}

export async function getPropertyById(id: string) {
  const [property] = await getDb().select().from(properties).where(eq(properties.id, id)).limit(1);

  if (!property) {
    throw new ApiError("PROPERTY_NOT_FOUND", "Property tidak ditemukan.", 404);
  }

  return property;
}

export async function createProperty(input: CreatePropertyInput) {
  const [property] = await getDb()
    .insert(properties)
    .values({
      name: input.name,
      address: input.address ?? null,
      description: input.description ?? null,
      pricePerNight: toMoney(input.pricePerNight),
      maxGuests: input.maxGuests,
      status: input.status,
    })
    .returning();

  return property;
}

export async function updateProperty(id: string, input: UpdatePropertyInput) {
  await getPropertyById(id);

  const [property] = await getDb()
    .update(properties)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.pricePerNight !== undefined ? { pricePerNight: toMoney(input.pricePerNight) } : {}),
      ...(input.maxGuests !== undefined ? { maxGuests: input.maxGuests } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      updatedAt: new Date(),
    })
    .where(eq(properties.id, id))
    .returning();

  return property;
}

export async function deactivateProperty(id: string) {
  return updateProperty(id, { status: "inactive" });
}
