"use client";

import { Download, MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ElevatedCard } from "@/components/ui/card";
import {
  formatCurrency,
  formatDate,
  formatDateRange,
  paymentStatusLabel,
  paymentStatusTone,
} from "@/lib/utils";
import type { Booking, Invoice, Property } from "@/types";

export function InvoicePreview({
  booking,
  invoice,
  property,
  shareUrl,
}: {
  booking: Booking;
  invoice: Invoice;
  property: Property;
  shareUrl: string;
}) {
  return (
    <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.75fr)]">
      <article className="min-h-[420px] rounded-[20px] border border-border bg-white p-5 md:p-6">
        <div className="mb-5 grid gap-4 border-b border-border pb-5 sm:grid-cols-[1fr_auto]">
          <div>
            <div className="text-3xl font-black tracking-[-0.04em]">Invoice</div>
            <p className="mt-1 text-sm text-muted-foreground">{invoice.invoiceNumber}</p>
          </div>
          <div className="sm:text-right">
            <strong>{property.name}</strong>
            <p className="mt-1 text-sm text-muted-foreground">{formatDate(invoice.invoiceDate)}</p>
          </div>
        </div>

        <div className="divide-y divide-border border-y border-border">
          <div className="grid gap-1 py-3 sm:grid-cols-[160px_1fr] sm:gap-3">
            <span className="text-sm text-muted-foreground">Nama tamu</span>
            <strong>{booking.guestName}</strong>
          </div>
          <div className="grid gap-1 py-3 sm:grid-cols-[160px_1fr] sm:gap-3">
            <span className="text-sm text-muted-foreground">Periode</span>
            <strong>{formatDateRange(booking.checkIn, booking.checkOut)} · {booking.totalNights} malam</strong>
          </div>
          <div className="grid gap-1 py-3 sm:grid-cols-[160px_1fr] sm:gap-3">
            <span className="text-sm text-muted-foreground">Nomor HP</span>
            <strong dir="ltr">{booking.guestPhone}</strong>
          </div>
        </div>

        <table className="mt-5 w-full border-collapse text-sm" aria-label="Rincian invoice">
          <thead>
            <tr>
              <th className="border-b border-border py-3 text-left">Item</th>
              <th className="border-b border-border py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-b border-border py-3">{formatCurrency(booking.pricePerNight)} x {booking.totalNights} malam</td>
              <td className="border-b border-border py-3 text-right tabular-nums">{formatCurrency(booking.subtotal)}</td>
            </tr>
            <tr>
              <td className="border-b border-border py-3">Biaya tambahan</td>
              <td className="border-b border-border py-3 text-right tabular-nums">{formatCurrency(booking.additionalFees)}</td>
            </tr>
            <tr>
              <td className="border-b border-border py-3">Diskon</td>
              <td className="border-b border-border py-3 text-right tabular-nums">{formatCurrency(booking.discount)}</td>
            </tr>
            <tr>
              <th className="py-3 text-left">Total tagihan</th>
              <th className="py-3 text-right tabular-nums">{formatCurrency(booking.totalPrice)}</th>
            </tr>
          </tbody>
        </table>
      </article>

      <ElevatedCard>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-[22px] font-black tracking-[-0.03em]">Status invoice</h2>
          <Badge tone={paymentStatusTone(booking.paymentStatus)}>{paymentStatusLabel(booking.paymentStatus)}</Badge>
        </div>
        <div className="divide-y divide-border border-y border-border">
          <div className="grid gap-1 py-3 sm:grid-cols-[120px_1fr]"><span className="text-sm text-muted-foreground">PDF</span><strong className="break-all">{invoice.pdfUrl ?? "Belum tersedia"}</strong></div>
          <div className="grid gap-1 py-3 sm:grid-cols-[120px_1fr]"><span className="text-sm text-muted-foreground">Generate ulang</span><strong>Tersedia dari detail booking</strong></div>
          <div className="grid gap-1 py-3 sm:grid-cols-[120px_1fr]"><span className="text-sm text-muted-foreground">Chat</span><strong>Buka WhatsApp pelanggan</strong></div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          <Button asChild>
            <a href={`/api/invoices/${invoice.id}/download`}>
              <Download className="h-4 w-4" />
              Download PDF
            </a>
          </Button>
          <Button asChild variant="primary">
            <a href={shareUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" />
              Chat WhatsApp
            </a>
          </Button>
        </div>
      </ElevatedCard>

    </div>
  );
}
