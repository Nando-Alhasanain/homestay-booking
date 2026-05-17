"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addMonths, endOfMonth, format, getDay, startOfMonth, subMonths } from "date-fns";
import { id } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { ClientApiError, fetchJson, normalizeProperty } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { Property } from "@/types";

const dayNames = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

type BookedDate = {
  date: string;
  bookingId: string;
  guestName: string;
  status: string;
};

function buildCalendarDays(monthDate: Date) {
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);
  const mondayBasedStart = (getDay(start) + 6) % 7;
  const days: Array<{ date: string; muted: boolean }> = [];

  for (let index = mondayBasedStart; index > 0; index -= 1) {
    const date = new Date(start);
    date.setDate(start.getDate() - index);
    days.push({ date: format(date, "yyyy-MM-dd"), muted: true });
  }

  for (let day = 1; day <= end.getDate(); day += 1) {
    const date = new Date(start);
    date.setDate(day);
    days.push({ date: format(date, "yyyy-MM-dd"), muted: false });
  }

  while (days.length % 7 !== 0) {
    const last = new Date(`${days[days.length - 1].date}T00:00:00`);
    last.setDate(last.getDate() + 1);
    days.push({ date: format(last, "yyyy-MM-dd"), muted: true });
  }

  return days;
}

export function AvailabilityCalendar() {
  const router = useRouter();
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyId, setPropertyId] = useState("");
  const [bookedDates, setBookedDates] = useState<BookedDate[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadProperties() {
      try {
        const response = await fetchJson<{ properties: Array<Record<string, unknown>> }>("/api/properties");
        if (cancelled) return;
        const normalizedProperties = response.properties.map(normalizeProperty);
        setProperties(normalizedProperties);
        setPropertyId((current) => current || normalizedProperties[0]?.id || "");
      } catch (error) {
        if (error instanceof ClientApiError && error.status === 401) {
          router.push("/login");
          return;
        }
        setError(error instanceof Error ? error.message : "Gagal memuat property.");
      }
    }

    loadProperties();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!propertyId) return;
    let cancelled = false;

    async function loadCalendar() {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          property_id: propertyId,
          month: String(monthDate.getMonth() + 1),
          year: String(monthDate.getFullYear()),
        });
        const response = await fetchJson<{ booked_dates: BookedDate[] }>(`/api/calendar?${params.toString()}`);
        if (!cancelled) setBookedDates(response.booked_dates);
      } catch (error) {
        if (error instanceof ClientApiError && error.status === 401) {
          router.push("/login");
          return;
        }
        if (!cancelled) setError(error instanceof Error ? error.message : "Gagal memuat kalender.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadCalendar();
    return () => {
      cancelled = true;
    };
  }, [monthDate, propertyId, router]);

  const days = useMemo(() => buildCalendarDays(monthDate), [monthDate]);
  const bookedMap = useMemo(() => new Map(bookedDates.map((date) => [date.date, date])), [bookedDates]);

  return (
    <Card className="overflow-hidden p-0">
      <div className="grid gap-3 border-b border-border p-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <Select value={propertyId} onChange={(event) => setPropertyId(event.target.value)}>
          {properties.map((property) => (
            <option key={property.id} value={property.id}>{property.name}</option>
          ))}
        </Select>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <Button size="icon" variant="default" aria-label="Bulan sebelumnya" onClick={() => setMonthDate((date) => subMonths(date, 1))}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-32 text-center">
            <h2 className="text-[22px] font-black tracking-[-0.03em]">{format(monthDate, "MMMM yyyy", { locale: id })}</h2>
            <p className="text-xs text-muted-foreground">{isLoading ? "Memuat..." : "Tanggal terisi dari API"}</p>
          </div>
          <Button size="icon" variant="default" aria-label="Bulan berikutnya" onClick={() => setMonthDate((date) => addMonths(date, 1))}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {error ? <p className="m-4 rounded-2xl border border-danger/20 bg-red-50 p-3 text-sm font-semibold text-danger">{error}</p> : null}

      <div className="overflow-x-auto">
        <div className="grid min-w-[680px] grid-cols-7">
          {dayNames.map((day) => (
            <div key={day} className="border-b border-r border-border bg-muted p-2.5 text-xs font-black text-muted-foreground last:border-r-0">
              {day}
            </div>
          ))}
          {days.map((day, index) => {
            const booked = bookedMap.get(day.date);
            const date = new Date(`${day.date}T00:00:00`);

            return (
              <Link
                key={day.date}
                href={booked ? `/bookings/${booked.bookingId}` : `/bookings/new`}
                className={cn(
                  "min-h-16 border-b border-r border-border p-2.5 text-sm transition hover:bg-muted last:border-r-0",
                  index % 7 === 6 && "border-r-0",
                  day.muted && "bg-white/60 text-[#c1c1c1]",
                  booked && "bg-red-50 font-black text-primary",
                )}
              >
                <span>{format(date, "d", { locale: id })}</span>
                {booked ? (
                  <small className="mt-1.5 block text-xs font-semibold text-muted-foreground">
                    {booked.guestName}
                  </small>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 p-4">
        <Badge tone="primary">Terisi</Badge>
        <Badge tone="neutral">Tanggal kosong normal</Badge>
      </div>
    </Card>
  );
}
