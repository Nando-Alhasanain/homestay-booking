"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus } from "lucide-react";

import { BookingCard } from "@/components/booking/booking-card";
import { Button } from "@/components/ui/button";
import { Card, ElevatedCard } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import {
  ClientApiError,
  fetchJson,
  normalizeBooking,
  normalizeDashboardStats,
} from "@/lib/api-client";
import { formatCompactCurrency } from "@/lib/utils";
import type { Booking, DashboardStats } from "@/types";

const emptyStats: DashboardStats = {
  activeBookings: 0,
  todayCheckIns: 0,
  todayCheckOuts: 0,
  unpaidBookings: 0,
  monthlyRevenue: 0,
  upcomingBookings: 0,
};

export function DashboardView() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const [statsResponse, bookingsResponse] = await Promise.all([
          fetchJson<Record<string, unknown>>("/api/dashboard/stats"),
          fetchJson<{ bookings: Array<Record<string, unknown>> }>("/api/bookings"),
        ]);
        if (cancelled) return;
        setStats(normalizeDashboardStats(statsResponse));
        setBookings(bookingsResponse.bookings.map(normalizeBooking).slice(0, 3));
      } catch (error) {
        if (error instanceof ClientApiError && error.status === 401) {
          router.push("/login");
          return;
        }
        setError(error instanceof Error ? error.message : "Gagal memuat dashboard.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const statItems = [
    { label: "Booking aktif", value: stats.activeBookings, foot: "Termasuk pending dan confirmed" },
    { label: "Check-in hari ini", value: stats.todayCheckIns, foot: "Perlu konfirmasi kedatangan" },
    { label: "Belum lunas", value: stats.unpaidBookings, foot: "Tagihan masih tersisa" },
    { label: "Revenue bulan ini", value: formatCompactCurrency(stats.monthlyRevenue), foot: "Akumulasi booking bulan ini" },
  ];

  return (
    <>
      <SectionHeader
        title="Dashboard"
        description="Ringkasan booking hari ini."
        action={
          <Button asChild variant="primary" className="hidden lg:inline-flex">
            <Link href="/bookings/new"><Plus className="h-4 w-4" /> Booking Baru</Link>
          </Button>
        }
      />

      {error ? <ApiErrorMessage message={error} /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statItems.map((stat, index) => (
          <Card key={stat.label} className="min-h-[134px]">
            <span className="text-sm text-muted-foreground">{stat.label}</span>
            <div className="mt-3 text-3xl font-black tracking-[-0.04em] tabular-nums">
              {isLoading ? "..." : stat.value}
            </div>
            {index === 3 ? (
              <div className="mt-4 flex h-14 items-end gap-1.5" aria-hidden="true">
                {[38, 62, 44, 82, 58].map((height) => (
                  <i key={height} className="mini-chart-bar" style={{ height: `${height}%` }} />
                ))}
              </div>
            ) : (
              <p className="mt-8 text-sm text-muted-foreground">{stat.foot}</p>
            )}
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.75fr)]">
        <ElevatedCard>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-[22px] font-black tracking-[-0.03em]">Booking terdekat</h2>
            <Link href="/bookings" className="inline-flex items-center gap-1 text-sm font-bold underline underline-offset-4">
              Lihat semua <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid gap-3">
            {isLoading ? <p className="text-sm text-muted-foreground">Memuat booking...</p> : null}
            {!isLoading && !bookings.length ? <p className="text-sm text-muted-foreground">Belum ada booking.</p> : null}
            {bookings.map((booking) => <BookingCard key={booking.id} booking={booking} />)}
          </div>
        </ElevatedCard>

        <Card>
          <h2 className="mb-4 text-[22px] font-black tracking-[-0.03em]">Aktivitas</h2>
          <div className="divide-y divide-border border-y border-border">
            <Activity label="Check-in" value={stats.todayCheckIns} />
            <Activity label="Check-out" value={stats.todayCheckOuts} />
            <Activity label="Booking mendatang" value={stats.upcomingBookings} />
          </div>
        </Card>
      </div>

      <Button asChild variant="primary" className="fixed bottom-24 right-4 z-50 shadow-panel lg:hidden">
        <Link href="/bookings/new"><Plus className="h-4 w-4" /> Booking</Link>
      </Button>
    </>
  );
}

function Activity({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 py-4">
      <span className="text-muted-foreground">{label}</span>
      <strong className="text-xl tabular-nums">{value}</strong>
    </div>
  );
}

function ApiErrorMessage({ message }: { message: string }) {
  return (
    <p className="mb-4 rounded-2xl border border-danger/20 bg-red-50 p-3 text-sm font-semibold text-danger">
      {message}
    </p>
  );
}
