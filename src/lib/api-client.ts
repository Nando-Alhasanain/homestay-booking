import type { Booking, DashboardStats, Invoice, Property } from "@/types";

export type ApiErrorBody = {
  error?: string;
  message?: string;
};

export class ClientApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });

  const contentType = response.headers.get("content-type");
  const body = contentType?.includes("application/json")
    ? ((await response.json()) as ApiErrorBody)
    : null;

  if (!response.ok) {
    throw new ClientApiError(
      body?.message ?? "Request gagal.",
      response.status,
      body?.error,
    );
  }

  return body as T;
}

export function normalizeProperty(property: Record<string, unknown>): Property {
  return {
    id: String(property.id),
    name: String(property.name),
    address: property.address ? String(property.address) : null,
    description: property.description ? String(property.description) : null,
    pricePerNight: Number(property.pricePerNight),
    maxGuests: Number(property.maxGuests),
    status: property.status as Property["status"],
  };
}

export function normalizeBooking(booking: Record<string, unknown>): Booking {
  return {
    id: String(booking.id),
    propertyId: String(booking.propertyId),
    propertyName: booking.propertyName ? String(booking.propertyName) : null,
    guestName: String(booking.guestName),
    guestPhone: String(booking.guestPhone),
    guestEmail: booking.guestEmail ? String(booking.guestEmail) : null,
    checkIn: String(booking.checkIn),
    checkOut: String(booking.checkOut),
    guestCount: Number(booking.guestCount),
    pricePerNight: Number(booking.pricePerNight),
    totalNights: Number(booking.totalNights),
    subtotal: Number(booking.subtotal),
    additionalFees: Number(booking.additionalFees),
    discount: Number(booking.discount),
    totalPrice: Number(booking.totalPrice),
    paidAmount: Number(booking.paidAmount),
    remainingAmount: Number(booking.remainingAmount),
    paymentMethod: booking.paymentMethod as Booking["paymentMethod"],
    bookingStatus: booking.bookingStatus as Booking["bookingStatus"],
    paymentStatus: booking.paymentStatus as Booking["paymentStatus"],
    notes: booking.notes ? String(booking.notes) : null,
    invoiceId: booking.invoiceId ? String(booking.invoiceId) : null,
    invoiceNumber: booking.invoiceNumber ? String(booking.invoiceNumber) : null,
  };
}

export function normalizeInvoice(invoice: Record<string, unknown>): Invoice {
  return {
    id: String(invoice.id),
    bookingId: String(invoice.bookingId),
    invoiceNumber: String(invoice.invoiceNumber),
    invoiceDate: String(invoice.invoiceDate),
    pdfUrl: invoice.pdfUrl ? String(invoice.pdfUrl) : null,
  };
}

export function normalizeDashboardStats(stats: Record<string, unknown>): DashboardStats {
  return {
    activeBookings: Number(stats.active_bookings ?? stats.activeBookings ?? 0),
    todayCheckIns: Number(stats.today_check_ins ?? stats.todayCheckIns ?? 0),
    todayCheckOuts: Number(stats.today_check_outs ?? stats.todayCheckOuts ?? 0),
    unpaidBookings: Number(stats.unpaid_bookings ?? stats.unpaidBookings ?? 0),
    monthlyRevenue: Number(stats.monthly_revenue ?? stats.monthlyRevenue ?? 0),
    upcomingBookings: Number(stats.upcoming_bookings ?? stats.upcomingBookings ?? 0),
  };
}
