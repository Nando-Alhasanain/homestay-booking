"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { BookingForm } from "@/components/booking/booking-form";
import { SectionHeader } from "@/components/ui/section-header";
import { ClientApiError, fetchJson, normalizeBooking } from "@/lib/api-client";
import { formatDateRange } from "@/lib/utils";
import type { Booking } from "@/types";

export function BookingEditView({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState("");

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

  if (error) {
    return <p className="rounded-2xl border border-danger/20 bg-red-50 p-3 text-sm font-semibold text-danger">{error}</p>;
  }

  if (!booking) {
    return <p className="text-sm text-muted-foreground">Memuat booking...</p>;
  }

  return (
    <>
      <SectionHeader
        title="Edit Booking"
        description={`${booking.guestName} · ${formatDateRange(booking.checkIn, booking.checkOut)}`}
      />
      <BookingForm mode="edit" bookingId={booking.id} initialBooking={booking} />
    </>
  );
}
