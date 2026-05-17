import { renderToBuffer } from "@react-pdf/renderer";
import { count, desc, eq, ilike, or } from "drizzle-orm";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { getDb } from "@/db";
import { bookings, invoices, properties } from "@/db/schema";
import { ApiError } from "@/lib/api-response";
import { getAppUrl, getInvoiceStoragePath } from "@/lib/env";
import { getWhatsAppInvoiceUrl } from "@/lib/utils";
import { InvoiceDocument } from "@/services/invoice-document";

function resolveStoragePath() {
  const storagePath = getInvoiceStoragePath();
  return path.isAbsolute(storagePath)
    ? storagePath
    : path.join(/* turbopackIgnore: true */ process.cwd(), storagePath);
}

async function getLogoDataUri() {
  const logoPath = path.join(/* turbopackIgnore: true */ process.cwd(), "public", "logo.png");
  const logoBuffer = await readFile(logoPath);
  return `data:image/png;base64,${logoBuffer.toString("base64")}`;
}

async function getBookingWithProperty(bookingId: string) {
  const [row] = await getDb()
    .select({ booking: bookings, property: properties })
    .from(bookings)
    .innerJoin(properties, eq(bookings.propertyId, properties.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!row) {
    throw new ApiError("BOOKING_NOT_FOUND", "Booking tidak ditemukan.", 404);
  }

  return row;
}

async function createInvoiceNumber(invoiceDate: string) {
  const datePart = invoiceDate.replaceAll("-", "");
  const [{ value }] = await getDb().select({ value: count() }).from(invoices);
  return `INV-${datePart}-${String(value + 1).padStart(4, "0")}`;
}

async function writeInvoicePdf(input: Awaited<ReturnType<typeof getBookingWithProperty>> & { invoice: typeof invoices.$inferSelect }) {
  const logoSrc = await getLogoDataUri();
  const buffer = await renderToBuffer(
    <InvoiceDocument booking={input.booking} property={input.property} invoice={input.invoice} logoSrc={logoSrc} />,
  );
  const storagePath = resolveStoragePath();
  await mkdir(storagePath, { recursive: true });

  const fileName = `${input.invoice.invoiceNumber}.pdf`;
  const filePath = path.join(storagePath, fileName);
  await writeFile(filePath, buffer);

  return `/storage/invoices/${fileName}`;
}

export async function generateInvoiceForBooking(bookingId: string) {
  const row = await getBookingWithProperty(bookingId);
  const [existing] = await getDb()
    .select()
    .from(invoices)
    .where(eq(invoices.bookingId, bookingId))
    .orderBy(desc(invoices.createdAt))
    .limit(1);

  const invoice = existing ?? (await createInvoice(row.booking));

  try {
    const pdfUrl = await writeInvoicePdf({ ...row, invoice });
    const [updated] = await getDb()
      .update(invoices)
      .set({ pdfUrl, updatedAt: new Date() })
      .where(eq(invoices.id, invoice.id))
      .returning();

    return updated;
  } catch (error) {
    console.error(error);
    throw new ApiError("INVOICE_GENERATION_FAILED", "Gagal membuat invoice PDF.", 500);
  }
}

async function createInvoice(booking: typeof bookings.$inferSelect) {
  const invoiceDate = new Date().toISOString().slice(0, 10);
  const invoiceNumber = await createInvoiceNumber(invoiceDate);
  const [invoice] = await getDb()
    .insert(invoices)
    .values({ bookingId: booking.id, invoiceDate, invoiceNumber })
    .returning();

  return invoice;
}

export async function getInvoiceById(id: string) {
  const [row] = await getDb()
    .select({ invoice: invoices, booking: bookings, property: properties })
    .from(invoices)
    .innerJoin(bookings, eq(invoices.bookingId, bookings.id))
    .innerJoin(properties, eq(bookings.propertyId, properties.id))
    .where(eq(invoices.id, id))
    .limit(1);

  if (!row) {
    throw new ApiError("INVOICE_NOT_FOUND", "Invoice tidak ditemukan.", 404);
  }

  const invoiceUrl = `${getAppUrl()}${row.invoice.pdfUrl ?? `/api/invoices/${id}/download`}`;

  return {
    ...row,
    shareUrl: getWhatsAppInvoiceUrl(row.booking.guestPhone, invoiceUrl),
  };
}

export async function readInvoicePdf(id: string) {
  const { invoice } = await getInvoiceById(id);

  if (!invoice.pdfUrl) {
    throw new ApiError("INVOICE_NOT_FOUND", "File invoice belum tersedia.", 404);
  }

  const fileName = path.basename(invoice.pdfUrl);
  const filePath = path.join(resolveStoragePath(), fileName);
  const buffer = await readFile(filePath);

  return { buffer, fileName };
}

export type ListInvoiceRow = {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  pdfUrl: string | null;
  guestName: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  totalPrice: string;
  paymentStatus: string;
  propertyName: string;
  createdAt: Date;
};

export async function listInvoices(search?: string) {
  const filters: ReturnType<typeof ilike>[] = [];

  if (search) {
    const pattern = `%${search}%`;
    const searchFilter = or(
      ilike(invoices.invoiceNumber, pattern),
      ilike(bookings.guestName, pattern),
      ilike(bookings.guestPhone, pattern),
    );
    if (searchFilter) filters.push(searchFilter);
  }

  const rows = await getDb()
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      invoiceDate: invoices.invoiceDate,
      pdfUrl: invoices.pdfUrl,
      guestName: bookings.guestName,
      guestPhone: bookings.guestPhone,
      checkIn: bookings.checkIn,
      checkOut: bookings.checkOut,
      totalPrice: bookings.totalPrice,
      paymentStatus: bookings.paymentStatus,
      propertyName: properties.name,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .innerJoin(bookings, eq(invoices.bookingId, bookings.id))
    .innerJoin(properties, eq(bookings.propertyId, properties.id))
    .where(filters.length ? or(...filters) : undefined)
    .orderBy(desc(invoices.createdAt));

  return rows;
}
