"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, FileText, MessageCircle, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, ElevatedCard } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { ClientApiError, fetchJson, normalizeBooking } from "@/lib/api-client";
import {
  bookingStatusLabel,
  bookingStatusTone,
  formatCurrency,
  formatDateRange,
  paymentStatusLabel,
  paymentStatusTone,
} from "@/lib/utils";
import type { Booking } from "@/types";

export function BookingDetailView({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadBooking() {
      try {
        const response = await fetchJson<{ booking: Record<string, unknown> }>(`/api/bookings/${bookingId}`);
        if (!cancelled) setBooking(normalizeBooking(response.booking));
      } catch (error) {
        if (error instanceof ClientApiError && error.status === 401) {
          router.push("/login");
          return;
        }
        if (!cancelled) setError(error instanceof Error ? error.message : "Gagal memuat booking.");
      }
    }

    loadBooking();
    return () => {
      cancelled = true;
    };
  }, [bookingId, router]);

  async function deleteBooking() {
    if (!booking || !window.confirm("Hapus booking ini permanen? Data booking dan invoice terkait akan dihapus dari database.")) return;

    try {
      await fetchJson<{ booking: Record<string, unknown> }>(`/api/bookings/${booking.id}`, {
        method: "DELETE",
      });
      setToast("Booking dihapus.");
      window.setTimeout(() => router.push("/bookings"), 600);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Gagal menghapus booking.");
    }
  }

  if (error) {
    return <p className="rounded-2xl border border-danger/20 bg-red-50 p-3 text-sm font-semibold text-danger">{error}</p>;
  }

  if (!booking) {
    return <p className="text-sm text-muted-foreground">Memuat detail booking...</p>;
  }

  const invoiceDownloadUrl = booking.invoiceId ? `/api/invoices/${booking.invoiceId}/download` : "#";

  return (
    <>
      <SectionHeader
        eyebrow="Detail booking"
        title={booking.guestName}
        description={`${formatDateRange(booking.checkIn, booking.checkOut)} · ${booking.totalNights} malam · ${booking.guestCount} tamu`}
        action={
          <>
            <Button asChild>
              <Link href={`/bookings/${booking.id}/edit`}><Pencil className="h-4 w-4" /> Edit</Link>
            </Button>
            <Button variant="danger" onClick={deleteBooking}><Trash2 className="h-4 w-4" /> Hapus</Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.75fr)]">
        <ElevatedCard>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge tone={bookingStatusTone(booking.bookingStatus)}>{bookingStatusLabel(booking.bookingStatus)}</Badge>
            <Badge tone={paymentStatusTone(booking.paymentStatus)}>{paymentStatusLabel(booking.paymentStatus)}</Badge>
          </div>
          <div className="divide-y divide-border border-y border-border">
            <Detail label="Nomor HP" value={booking.guestPhone} />
            <Detail label="Email" value={booking.guestEmail || "-"} />
            <Detail label="Property" value={booking.propertyName ?? "-"} />
            <Detail label="Tanggal" value={formatDateRange(booking.checkIn, booking.checkOut)} />
            <Detail label="Catatan" value={booking.notes || "-"} />
          </div>
        </ElevatedCard>

        <Card>
          <h2 className="mb-4 text-[22px] font-black tracking-[-0.03em]">Detail harga</h2>
          <div className="grid gap-2 rounded-2xl bg-muted p-4 text-sm">
            <Price label="Harga per malam" value={booking.pricePerNight} />
            <Price label="Subtotal" value={booking.subtotal} />
            <Price label="Biaya tambahan" value={booking.additionalFees} />
            <Price label="Diskon" value={booking.discount} />
            <Price label="Total tagihan" value={booking.totalPrice} strong />
            <Price label="Jumlah dibayar" value={booking.paidAmount} />
            <Price label="Sisa pembayaran" value={booking.remainingAmount} strong />
          </div>
          <div className="mt-4 grid gap-2">
            <Button asChild variant="primary" disabled={!booking.invoiceId}>
              <Link href={booking.invoiceId ? `/invoices/${booking.invoiceId}` : "#"}><FileText className="h-4 w-4" /> Lihat Invoice</Link>
            </Button>
            <Button asChild disabled={!booking.invoiceId}>
              <a href={invoiceDownloadUrl}><Download className="h-4 w-4" /> Download Invoice</a>
            </Button>
            <Button
              onClick={() => {
                if (!booking.invoiceId) return;
                void navigator.clipboard?.writeText(`${window.location.origin}/invoices/${booking.invoiceId}`);
                setToast("Link invoice disalin.");
                window.setTimeout(() => setToast(""), 2200);
              }}
            >
              <MessageCircle className="h-4 w-4" /> Share WhatsApp
            </Button>
          </div>
        </Card>
      </div>

      {toast ? (
        <div className="fixed bottom-24 right-4 z-50 rounded-[20px] bg-foreground px-4 py-3 text-sm font-bold text-white shadow-panel lg:bottom-6">
          {toast}
        </div>
      ) : null}
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="grid gap-1 py-3 sm:grid-cols-[160px_1fr]"><span className="text-sm text-muted-foreground">{label}</span><strong>{value}</strong></div>;
}

function Price({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return <div className="flex justify-between gap-3 text-muted-foreground"><span>{label}</span><strong className={strong ? "text-foreground" : "text-foreground/80"}>{formatCurrency(value)}</strong></div>;
}
