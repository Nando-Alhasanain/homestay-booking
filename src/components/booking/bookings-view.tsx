"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, Plus } from "lucide-react";

import { BookingCard } from "@/components/booking/booking-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SectionHeader } from "@/components/ui/section-header";
import { ClientApiError, fetchJson, normalizeBooking } from "@/lib/api-client";
import type { Booking } from "@/types";

export function BookingsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [status, setStatus] = useState(() => searchParams.get("status") ?? "all");
  const [paymentStatus, setPaymentStatus] = useState(() => searchParams.get("payment_status") ?? "all");
  const [showFilters, setShowFilters] = useState(() => Boolean(searchParams.get("search") || searchParams.get("status") || searchParams.get("payment_status")));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadBookings() {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (status !== "all") params.set("status", status);
        if (paymentStatus !== "all") params.set("payment_status", paymentStatus);

        router.replace(`/bookings?${params.toString()}`, { scroll: false });

        const response = await fetchJson<{ bookings: Array<Record<string, unknown>> }>(`/api/bookings?${params.toString()}`);
        if (!cancelled) setBookings(response.bookings.map(normalizeBooking));
      } catch (error) {
        if (error instanceof ClientApiError && error.status === 401) {
          router.push("/login");
          return;
        }
        if (!cancelled) setError(error instanceof Error ? error.message : "Gagal memuat booking.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    const timeout = window.setTimeout(loadBookings, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [paymentStatus, router, search, status]);

  const content = useMemo(() => {
    if (isLoading) return <p className="text-sm text-muted-foreground">Memuat booking...</p>;
    if (error) return <p className="rounded-2xl border border-danger/20 bg-red-50 p-3 text-sm font-semibold text-danger">{error}</p>;
    if (!bookings.length) return <p className="text-sm text-muted-foreground">Belum ada booking yang sesuai filter.</p>;
    return bookings.map((booking) => <BookingCard key={booking.id} booking={booking} />);
  }, [bookings, error, isLoading]);
  const activeFilterCount = [search, status !== "all", paymentStatus !== "all"].filter(Boolean).length;

  return (
    <>
      <SectionHeader
        title="Booking"
        description="Kelola daftar booking tamu."
        action={
          <Button asChild variant="primary" className="hidden lg:inline-flex">
            <Link href="/bookings/new"><Plus className="h-4 w-4" /> Booking Baru</Link>
          </Button>
        }
      />

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black tracking-[-0.03em]">Daftar booking</h2>
            <p className="text-sm text-muted-foreground">{bookings.length} booking ditampilkan</p>
          </div>
          <Button
            type="button"
            variant={showFilters || activeFilterCount > 0 ? "primary" : "default"}
            onClick={() => setShowFilters((value) => !value)}
            aria-expanded={showFilters}
          >
            <Filter className="h-4 w-4" />
            Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </Button>
        </div>

        {showFilters ? (
          <div className="mb-4 grid gap-2 rounded-[20px] border border-border bg-muted p-3 sm:grid-cols-3">
            <Input placeholder="Cari nama tamu" value={search} onChange={(event) => setSearch(event.target.value)} />
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">Semua status booking</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="checked_in">Checked-in</option>
              <option value="checked_out">Checked-out</option>
              <option value="cancelled">Cancelled</option>
            </Select>
            <Select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)}>
              <option value="all">Semua pembayaran</option>
              <option value="paid">Lunas</option>
              <option value="partial">Sebagian</option>
              <option value="unpaid">Belum bayar</option>
            </Select>
          </div>
        ) : null}

        <div className="grid gap-3">{content}</div>
      </Card>

      <Button asChild variant="primary" className="fixed bottom-24 right-4 z-50 shadow-panel lg:hidden">
        <Link href="/bookings/new"><Plus className="h-4 w-4" /> Booking</Link>
      </Button>
    </>
  );
}
