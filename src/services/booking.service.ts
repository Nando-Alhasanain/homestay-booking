import { and, desc, eq, gt, gte, ilike, lt, lte, ne, or, type SQL } from "drizzle-orm";

import { getDb } from "@/db";
import { blockedDates, bookings, invoices, properties } from "@/db/schema";
import { ApiError } from "@/lib/api-response";
import { calculateBooking } from "@/lib/utils";
import { deleteInvoicesForBooking, generateInvoiceForBooking } from "@/services/invoice.service";
import type { CreateBookingInput, UpdateBookingInput } from "@/validators/booking.validator";
import type { bookingQuerySchema } from "@/validators/query.validator";
import type { z } from "zod";

type BookingQuery = z.infer<typeof bookingQuerySchema>;

function toMoney(value: number) {
  return value.toFixed(2);
}

function normalizeEmail(value?: string | null) {
  return value ? value : null;
}

export async function listBookings(query: BookingQuery = {}) {
  const filters: SQL[] = [];

  if (query.status) filters.push(eq(bookings.bookingStatus, query.status));
  if (query.paymentStatus) filters.push(eq(bookings.paymentStatus, query.paymentStatus));
  if (query.startDate) filters.push(gte(bookings.checkIn, query.startDate));
  if (query.endDate) filters.push(lte(bookings.checkOut, query.endDate));
  if (query.search) {
    const pattern = `%${query.search}%`;
    const searchFilter = or(
      ilike(bookings.guestName, pattern),
      ilike(bookings.guestPhone, pattern),
      ilike(bookings.guestEmail, pattern),
      ilike(properties.name, pattern),
    );
    if (searchFilter) filters.push(searchFilter);
  }

  const rows = await getDb()
    .select({
      booking: bookings,
      propertyName: properties.name,
      invoiceId: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
    })
    .from(bookings)
    .leftJoin(properties, eq(bookings.propertyId, properties.id))
    .leftJoin(invoices, eq(invoices.bookingId, bookings.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(bookings.checkIn));

  return rows.map((row) => ({
    ...row.booking,
    propertyName: row.propertyName,
    invoiceId: row.invoiceId,
    invoiceNumber: row.invoiceNumber,
  }));
}

export async function getBookingById(id: string) {
  const [row] = await getDb()
    .select({
      booking: bookings,
      propertyName: properties.name,
      invoiceId: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
    })
    .from(bookings)
    .leftJoin(properties, eq(bookings.propertyId, properties.id))
    .leftJoin(invoices, eq(invoices.bookingId, bookings.id))
    .where(eq(bookings.id, id))
    .limit(1);

  if (!row) {
    throw new ApiError("BOOKING_NOT_FOUND", "Booking tidak ditemukan.", 404);
  }

  return {
    ...row.booking,
    propertyName: row.propertyName,
    invoiceId: row.invoiceId,
    invoiceNumber: row.invoiceNumber,
  };
}

async function assertPropertyExists(propertyId: string) {
  const [property] = await getDb().select().from(properties).where(eq(properties.id, propertyId)).limit(1);

  if (!property) {
    throw new ApiError("PROPERTY_NOT_FOUND", "Property tidak ditemukan.", 404);
  }

  return property;
}

export async function assertNoBookingConflict(input: {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  excludeBookingId?: string;
}) {
  const filters = [
    eq(bookings.propertyId, input.propertyId),
    ne(bookings.bookingStatus, "cancelled"),
    lt(bookings.checkIn, input.checkOut),
    gt(bookings.checkOut, input.checkIn),
  ];

  if (input.excludeBookingId) {
    filters.push(ne(bookings.id, input.excludeBookingId));
  }

  const [conflict] = await getDb().select({ id: bookings.id }).from(bookings).where(and(...filters)).limit(1);

  if (conflict) {
    throw new ApiError(
      "BOOKING_CONFLICT",
      "Property is already booked for selected dates.",
      409,
    );
  }
}

async function assertNoBlockedDateConflict(input: {
  propertyId: string;
  checkIn: string;
  checkOut: string;
}) {
  const [conflict] = await getDb()
    .select({ id: blockedDates.id })
    .from(blockedDates)
    .where(
      and(
        eq(blockedDates.propertyId, input.propertyId),
        lt(blockedDates.startDate, input.checkOut),
        gt(blockedDates.endDate, input.checkIn),
      ),
    )
    .limit(1);

  if (conflict) {
    throw new ApiError("BLOCKED_DATE_CONFLICT", "Tanggal tersebut sedang diblokir.", 409);
  }
}

export async function createBooking(input: CreateBookingInput, createdBy?: string) {
  await assertPropertyExists(input.propertyId);
  await assertNoBookingConflict({
    propertyId: input.propertyId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
  });
  await assertNoBlockedDateConflict({
    propertyId: input.propertyId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
  });

  const calculation = calculateBooking({
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    pricePerNight: input.pricePerNight,
    additionalFees: input.additionalFees,
    discount: input.discount,
    paidAmount: input.paidAmount,
  });

  const [booking] = await getDb()
    .insert(bookings)
    .values({
      propertyId: input.propertyId,
      guestName: input.guestName,
      guestPhone: input.guestPhone,
      guestEmail: normalizeEmail(input.guestEmail),
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      guestCount: input.guestCount,
      pricePerNight: toMoney(input.pricePerNight),
      totalNights: calculation.totalNights,
      subtotal: toMoney(calculation.subtotal),
      additionalFees: toMoney(input.additionalFees),
      discount: toMoney(input.discount),
      totalPrice: toMoney(calculation.totalPrice),
      paidAmount: toMoney(input.paidAmount),
      remainingAmount: toMoney(calculation.remainingAmount),
      paymentMethod: input.paymentMethod ?? null,
      bookingStatus: input.bookingStatus,
      paymentStatus: calculation.paymentStatus,
      notes: input.notes ?? null,
      createdBy,
    })
    .returning();

  const invoice = await generateInvoiceForBooking(booking.id);

  return { booking, invoice };
}

export async function updateBooking(id: string, input: UpdateBookingInput) {
  const existing = await getBookingById(id);
  const next = { ...existing, ...input };

  await assertPropertyExists(next.propertyId);

  if (input.propertyId || input.checkIn || input.checkOut) {
    await assertNoBookingConflict({
      propertyId: next.propertyId,
      checkIn: next.checkIn,
      checkOut: next.checkOut,
      excludeBookingId: id,
    });
    await assertNoBlockedDateConflict({
      propertyId: next.propertyId,
      checkIn: next.checkIn,
      checkOut: next.checkOut,
    });
  }

  const calculation = calculateBooking({
    checkIn: next.checkIn,
    checkOut: next.checkOut,
    pricePerNight: Number(next.pricePerNight),
    additionalFees: Number(next.additionalFees),
    discount: Number(next.discount),
    paidAmount: Number(next.paidAmount),
  });

  const [booking] = await getDb()
    .update(bookings)
    .set({
      propertyId: next.propertyId,
      guestName: next.guestName,
      guestPhone: next.guestPhone,
      guestEmail: normalizeEmail(next.guestEmail),
      checkIn: next.checkIn,
      checkOut: next.checkOut,
      guestCount: next.guestCount,
      pricePerNight: toMoney(Number(next.pricePerNight)),
      totalNights: calculation.totalNights,
      subtotal: toMoney(calculation.subtotal),
      additionalFees: toMoney(Number(next.additionalFees)),
      discount: toMoney(Number(next.discount)),
      totalPrice: toMoney(calculation.totalPrice),
      paidAmount: toMoney(Number(next.paidAmount)),
      remainingAmount: toMoney(calculation.remainingAmount),
      paymentMethod: next.paymentMethod ?? null,
      bookingStatus: next.bookingStatus,
      paymentStatus: calculation.paymentStatus,
      notes: next.notes ?? null,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, id))
    .returning();

  await generateInvoiceForBooking(id);

  return booking;
}

export async function cancelBooking(id: string) {
  await getBookingById(id);

  const [booking] = await getDb()
    .update(bookings)
    .set({ bookingStatus: "cancelled", updatedAt: new Date() })
    .where(eq(bookings.id, id))
    .returning();

  return booking;
}

export async function deleteBooking(id: string) {
  const existing = await getBookingById(id);

  await deleteInvoicesForBooking(id);
  await getDb().delete(bookings).where(eq(bookings.id, id));

  return existing;
}

export async function listCalendarDates(input: { propertyId: string; month: number; year: number }) {
  const monthStart = `${input.year}-${String(input.month).padStart(2, "0")}-01`;
  const nextMonth = input.month === 12 ? 1 : input.month + 1;
  const nextMonthYear = input.month === 12 ? input.year + 1 : input.year;
  const monthEnd = `${nextMonthYear}-${String(nextMonth).padStart(2, "0")}-01`;

  const rows = await getDb()
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.propertyId, input.propertyId),
        ne(bookings.bookingStatus, "cancelled"),
        lt(bookings.checkIn, monthEnd),
        gt(bookings.checkOut, monthStart),
      ),
    );

  return rows.flatMap((booking) => {
    const dates: Array<{ date: string; bookingId: string; guestName: string; status: string }> = [];
    const cursor = new Date(`${booking.checkIn}T00:00:00`);
    const end = new Date(`${booking.checkOut}T00:00:00`);

    while (cursor < end) {
      const date = cursor.toISOString().slice(0, 10);
      if (date >= monthStart && date < monthEnd) {
        dates.push({
          date,
          bookingId: booking.id,
          guestName: booking.guestName,
          status: booking.bookingStatus,
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    return dates;
  });
}
