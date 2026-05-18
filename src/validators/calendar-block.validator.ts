import { z } from "zod";

export const createCalendarBlockSchema = z.object({
  propertyId: z.string().uuid("Property wajib dipilih"),
  startDate: z.string().date("Tanggal mulai wajib diisi"),
  endDate: z.string().date("Tanggal selesai wajib diisi"),
  reason: z.string().optional().nullable(),
}).refine((data) => data.endDate > data.startDate, {
  message: "Tanggal selesai harus setelah tanggal mulai",
  path: ["endDate"],
});

export type CreateCalendarBlockInput = z.infer<typeof createCalendarBlockSchema>;
