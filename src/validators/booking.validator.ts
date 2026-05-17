import { z } from "zod";

export const bookingStatusSchema = z.enum([
  "pending",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled",
]);

export const paymentMethodSchema = z.enum(["cash", "bank_transfer", "qris", "other"]);

const bookingBaseSchema = z.object({
  propertyId: z.string().uuid("Property wajib dipilih"),
  guestName: z.string().min(1, "Nama tamu wajib diisi"),
  guestPhone: z.string().min(1, "Nomor HP wajib diisi"),
  guestEmail: z.string().email("Email tidak valid").optional().nullable().or(z.literal("")),
  checkIn: z.string().date("Tanggal check-in wajib diisi"),
  checkOut: z.string().date("Tanggal check-out wajib diisi"),
  guestCount: z.coerce.number().int().min(1, "Jumlah tamu minimal 1"),
  pricePerNight: z.coerce.number().min(0, "Harga per malam tidak boleh negatif"),
  additionalFees: z.coerce.number().min(0, "Biaya tambahan tidak boleh negatif").default(0),
  discount: z.coerce.number().min(0, "Diskon tidak boleh negatif").default(0),
  paidAmount: z.coerce.number().min(0, "Jumlah dibayar tidak boleh negatif").default(0),
  paymentMethod: paymentMethodSchema.optional().nullable(),
  bookingStatus: bookingStatusSchema.default("pending"),
  notes: z.string().optional().nullable(),
});

export const createBookingSchema = bookingBaseSchema.refine((data) => data.checkOut > data.checkIn, {
  message: "Check-out harus setelah check-in",
  path: ["checkOut"],
});

export const updateBookingSchema = bookingBaseSchema.partial().refine(
  (data) => {
    if (!data.checkIn || !data.checkOut) return true;
    return data.checkOut > data.checkIn;
  },
  {
    message: "Check-out harus setelah check-in",
    path: ["checkOut"],
  },
);

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
