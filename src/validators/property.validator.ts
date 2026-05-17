import { z } from "zod";

export const propertyStatusSchema = z.enum(["active", "inactive", "maintenance"]);

export const createPropertySchema = z.object({
  name: z.string().min(1, "Nama property wajib diisi"),
  address: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  pricePerNight: z.coerce.number().min(0, "Harga per malam tidak boleh negatif"),
  maxGuests: z.coerce.number().int().min(1, "Kapasitas tamu minimal 1"),
  status: propertyStatusSchema.default("active"),
});

export const updatePropertySchema = createPropertySchema.partial();

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
