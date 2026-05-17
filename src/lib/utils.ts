import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { BookingStatus, PaymentStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactCurrency(value: number) {
  if (value >= 1_000_000) {
    return `Rp${Math.round(value / 1_000_000)} jt`;
  }

  return formatCurrency(value);
}

export function formatDate(date: string) {
  return format(parseISO(date), "d MMMM yyyy", { locale: id });
}

export function formatDateRange(checkIn: string, checkOut: string) {
  return `${format(parseISO(checkIn), "d MMM", { locale: id })} - ${format(
    parseISO(checkOut),
    "d MMM yyyy",
    { locale: id },
  )}`;
}

export function getTotalNights(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0;

  const nights = differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn));
  return Math.max(nights, 0);
}

export function getPaymentStatus(paidAmount: number, totalPrice: number): PaymentStatus {
  if (paidAmount <= 0) return "unpaid";
  if (paidAmount >= totalPrice) return "paid";
  return "partial";
}

export function calculateBooking(values: {
  checkIn: string;
  checkOut: string;
  pricePerNight: number;
  additionalFees: number;
  discount: number;
  paidAmount: number;
}) {
  const totalNights = getTotalNights(values.checkIn, values.checkOut);
  const subtotal = totalNights * values.pricePerNight;
  const totalPrice = Math.max(subtotal + values.additionalFees - values.discount, 0);
  const remainingAmount = Math.max(totalPrice - values.paidAmount, 0);
  const paymentStatus = getPaymentStatus(values.paidAmount, totalPrice);

  return {
    totalNights,
    subtotal,
    totalPrice,
    remainingAmount,
    paymentStatus,
  };
}

export function paymentStatusLabel(status: PaymentStatus) {
  const labels: Record<PaymentStatus, string> = {
    unpaid: "Belum bayar",
    partial: "Sebagian",
    paid: "Lunas",
  };

  return labels[status];
}

export function bookingStatusLabel(status: BookingStatus) {
  const labels: Record<BookingStatus, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    checked_in: "Check-in",
    checked_out: "Check-out",
    cancelled: "Cancelled",
  };

  return labels[status];
}

export function paymentStatusTone(status: PaymentStatus): "success" | "warning" | "danger" {
  if (status === "paid") return "success";
  if (status === "partial") return "warning";
  return "danger";
}

export function bookingStatusTone(
  status: BookingStatus,
): "success" | "warning" | "danger" | "neutral" {
  if (status === "confirmed" || status === "checked_in") return "success";
  if (status === "pending") return "warning";
  if (status === "cancelled") return "danger";
  return "neutral";
}

export function getWhatsAppInvoiceUrl(phone: string, invoiceUrl: string) {
  const normalizedPhone = phone.replace(/\D/g, "").replace(/^0/, "62");
  const text = encodeURIComponent(
    `Halo, berikut invoice booking homestay Anda: ${invoiceUrl}`,
  );

  return `https://wa.me/${normalizedPhone}?text=${text}`;
}
