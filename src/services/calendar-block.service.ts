import { and, eq, gt, lt } from "drizzle-orm";

import { getDb } from "@/db";
import { blockedDates } from "@/db/schema";
import { ApiError } from "@/lib/api-response";
import { assertNoBookingConflict } from "@/services/booking.service";
import type { CreateCalendarBlockInput } from "@/validators/calendar-block.validator";

export async function assertNoBlockedDateConflict(input: {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  excludeBlockId?: string;
}) {
  const filters = [
    eq(blockedDates.propertyId, input.propertyId),
    lt(blockedDates.startDate, input.checkOut),
    gt(blockedDates.endDate, input.checkIn),
  ];

  const [conflict] = await getDb()
    .select({ id: blockedDates.id })
    .from(blockedDates)
    .where(and(...filters))
    .limit(1);

  if (conflict && conflict.id !== input.excludeBlockId) {
    throw new ApiError("BLOCKED_DATE_CONFLICT", "Tanggal tersebut sedang diblokir.", 409);
  }
}

export async function createCalendarBlock(input: CreateCalendarBlockInput) {
  await assertNoBookingConflict({
    propertyId: input.propertyId,
    checkIn: input.startDate,
    checkOut: input.endDate,
  });
  await assertNoBlockedDateConflict({
    propertyId: input.propertyId,
    checkIn: input.startDate,
    checkOut: input.endDate,
  });

  const [block] = await getDb()
    .insert(blockedDates)
    .values({
      propertyId: input.propertyId,
      startDate: input.startDate,
      endDate: input.endDate,
      reason: input.reason || null,
    })
    .returning();

  return block;
}

export async function deleteCalendarBlock(id: string) {
  const [block] = await getDb().delete(blockedDates).where(eq(blockedDates.id, id)).returning();

  if (!block) {
    throw new ApiError("DATE_BLOCK_NOT_FOUND", "Blok tanggal tidak ditemukan.", 404);
  }

  return block;
}

export async function listCalendarBlocks(input: { propertyId: string; month: number; year: number }) {
  const monthStart = `${input.year}-${String(input.month).padStart(2, "0")}-01`;
  const nextMonth = input.month === 12 ? 1 : input.month + 1;
  const nextMonthYear = input.month === 12 ? input.year + 1 : input.year;
  const monthEnd = `${nextMonthYear}-${String(nextMonth).padStart(2, "0")}-01`;

  return getDb()
    .select()
    .from(blockedDates)
    .where(
      and(
        eq(blockedDates.propertyId, input.propertyId),
        lt(blockedDates.startDate, monthEnd),
        gt(blockedDates.endDate, monthStart),
      ),
    );
}

export function expandCalendarBlocks(
  blocks: Array<typeof blockedDates.$inferSelect>,
  input: { month: number; year: number },
) {
  const monthStart = `${input.year}-${String(input.month).padStart(2, "0")}-01`;
  const nextMonth = input.month === 12 ? 1 : input.month + 1;
  const nextMonthYear = input.month === 12 ? input.year + 1 : input.year;
  const monthEnd = `${nextMonthYear}-${String(nextMonth).padStart(2, "0")}-01`;

  return blocks.flatMap((block) => {
    const dates: Array<{ date: string; blockId: string; reason: string | null }> = [];
    const cursor = new Date(`${block.startDate}T00:00:00`);
    const end = new Date(`${block.endDate}T00:00:00`);

    while (cursor < end) {
      const date = cursor.toISOString().slice(0, 10);
      if (date >= monthStart && date < monthEnd) {
        dates.push({ date, blockId: block.id, reason: block.reason });
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    return dates;
  });
}
