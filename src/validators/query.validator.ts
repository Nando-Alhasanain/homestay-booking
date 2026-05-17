import { z } from "zod";

export const bookingQuerySchema = z.object({
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  status: z.string().optional(),
  paymentStatus: z.string().optional(),
  search: z.string().optional(),
});

export const calendarQuerySchema = z.object({
  propertyId: z.string().uuid("Property wajib dipilih"),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});
