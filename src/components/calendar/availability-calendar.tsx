"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addDays, addMonths, endOfMonth, format, getDay, parseISO, startOfMonth, subDays, subMonths } from "date-fns";
import { id } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ClientApiError, fetchJson, normalizeProperty } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { Property } from "@/types";

const dayNames = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const bookingColorClasses = [
  {
    cell: "bg-sky-100 font-black text-sky-700 ring-1 ring-inset ring-sky-200 hover:bg-sky-100",
    date: "bg-white text-sky-700 shadow-sm",
    text: "text-sky-950/80",
  },
  {
    cell: "bg-emerald-100 font-black text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100",
    date: "bg-white text-emerald-700 shadow-sm",
    text: "text-emerald-950/80",
  },
  {
    cell: "bg-violet-100 font-black text-violet-700 ring-1 ring-inset ring-violet-200 hover:bg-violet-100",
    date: "bg-white text-violet-700 shadow-sm",
    text: "text-violet-950/80",
  },
  {
    cell: "bg-rose-100 font-black text-rose-700 ring-1 ring-inset ring-rose-200 hover:bg-rose-100",
    date: "bg-white text-rose-700 shadow-sm",
    text: "text-rose-950/80",
  },
  {
    cell: "bg-amber-100 font-black text-amber-700 ring-1 ring-inset ring-amber-200 hover:bg-amber-100",
    date: "bg-white text-amber-700 shadow-sm",
    text: "text-amber-950/80",
  },
  {
    cell: "bg-cyan-100 font-black text-cyan-700 ring-1 ring-inset ring-cyan-200 hover:bg-cyan-100",
    date: "bg-white text-cyan-700 shadow-sm",
    text: "text-cyan-950/80",
  },
  {
    cell: "bg-fuchsia-100 font-black text-fuchsia-700 ring-1 ring-inset ring-fuchsia-200 hover:bg-fuchsia-100",
    date: "bg-white text-fuchsia-700 shadow-sm",
    text: "text-fuchsia-950/80",
  },
  {
    cell: "bg-lime-100 font-black text-lime-700 ring-1 ring-inset ring-lime-200 hover:bg-lime-100",
    date: "bg-white text-lime-700 shadow-sm",
    text: "text-lime-950/80",
  },
] as const;

type BookedDate = {
  date: string;
  bookingId: string;
  guestName: string;
  status: string;
};

type BookingEvent = {
  date: string;
  type: "check_in" | "check_out";
  bookingId: string;
  guestName: string;
  status: string;
};

type BlockedDate = {
  date: string;
  blockId: string;
  reason: string | null;
};

type DateBlock = {
  id: string;
  propertyId: string;
  startDate: string;
  endDate: string;
  reason: string | null;
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

function toDateValue(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function getBookingColor(bookingId: string) {
  let hash = 0;

  for (let index = 0; index < bookingId.length; index += 1) {
    hash = (hash + bookingId.charCodeAt(index) * (index + 1)) % bookingColorClasses.length;
  }

  return bookingColorClasses[hash];
}

function formatDateRange(block: DateBlock) {
  const start = parseISO(block.startDate);
  const end = subDays(parseISO(block.endDate), 1);
  const sameDay = block.startDate === toDateValue(end);

  if (sameDay) return format(start, "d MMMM yyyy", { locale: id });
  return `${format(start, "d MMM", { locale: id })} - ${format(end, "d MMM yyyy", { locale: id })}`;
}

export function AvailabilityCalendar() {
  const router = useRouter();
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyId, setPropertyId] = useState("");
  const [bookedDates, setBookedDates] = useState<BookedDate[]>([]);
  const [bookingEvents, setBookingEvents] = useState<BookingEvent[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [dateBlocks, setDateBlocks] = useState<DateBlock[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isBlocking, setIsBlocking] = useState(false);
  const [deletingBlockId, setDeletingBlockId] = useState("");
  const [blockStartDate, setBlockStartDate] = useState("");
  const [blockEndDate, setBlockEndDate] = useState("");
  const [blockReason, setBlockReason] = useState("");

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
        const response = await fetchJson<{ booked_dates: BookedDate[]; booking_events: BookingEvent[]; blocked_dates: BlockedDate[]; date_blocks: DateBlock[] }>(`/api/calendar?${params.toString()}`);
        if (!cancelled) {
          setBookedDates(response.booked_dates);
          setBookingEvents(response.booking_events ?? []);
          setBlockedDates(response.blocked_dates);
          setDateBlocks(response.date_blocks);
        }
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
  const eventMap = useMemo(() => {
    const map = new Map<string, BookingEvent[]>();

    for (const event of bookingEvents) {
      const events = map.get(event.date) ?? [];
      events.push(event);
      map.set(event.date, events);
    }

    return map;
  }, [bookingEvents]);
  const blockedMap = useMemo(() => new Map(blockedDates.map((date) => [date.date, date])), [blockedDates]);

  async function createDateBlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!propertyId || !blockStartDate || !blockEndDate) return;

    setIsBlocking(true);
    setError("");

    try {
      const endDate = toDateValue(addDays(parseISO(blockEndDate), 1));
      await fetchJson("/api/calendar/blocks", {
        method: "POST",
        body: JSON.stringify({
          propertyId,
          startDate: blockStartDate,
          endDate,
          reason: blockReason,
        }),
      });
      setBlockStartDate("");
      setBlockEndDate("");
      setBlockReason("");
      setMonthDate((date) => new Date(date));
    } catch (error) {
      if (error instanceof ClientApiError && error.status === 401) {
        router.push("/login");
        return;
      }
      setError(error instanceof Error ? error.message : "Gagal memblokir tanggal.");
    } finally {
      setIsBlocking(false);
    }
  }

  async function deleteDateBlock(block: DateBlock) {
    const confirmed = window.confirm(`Hapus blok tanggal ${formatDateRange(block)}?`);
    if (!confirmed) return;

    setDeletingBlockId(block.id);
    setError("");

    try {
      await fetchJson(`/api/calendar/blocks/${block.id}`, { method: "DELETE" });
      setMonthDate((date) => new Date(date));
    } catch (error) {
      if (error instanceof ClientApiError && error.status === 401) {
        router.push("/login");
        return;
      }
      setError(error instanceof Error ? error.message : "Gagal menghapus blok tanggal.");
    } finally {
      setDeletingBlockId("");
    }
  }

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

      <div className="overflow-x-hidden sm:overflow-x-auto">
        <div className="grid grid-cols-7 sm:min-w-[680px]">
          {dayNames.map((day) => (
            <div key={day} className="border-b border-r border-border bg-muted p-1.5 text-center text-[10px] font-black text-muted-foreground last:border-r-0 sm:p-2.5 sm:text-left sm:text-xs">
              {day}
            </div>
          ))}
          {days.map((day, index) => {
            const booked = bookedMap.get(day.date);
            const blocked = blockedMap.get(day.date);
            const events = eventMap.get(day.date) ?? [];
            const bookingColor = booked ? getBookingColor(booked.bookingId) : null;
            const date = new Date(`${day.date}T00:00:00`);
            const isBlockedOnly = !booked && blocked;

            const className = cn(
              "group relative min-h-11 border-b border-r border-border p-1.5 text-left text-xs transition last:border-r-0 hover:bg-muted sm:min-h-16 sm:p-2.5 sm:text-sm",
              index % 7 === 6 && "border-r-0",
              day.muted && "bg-white/60 text-[#c1c1c1]",
              bookingColor?.cell,
              isBlockedOnly && "bg-foreground font-black text-white hover:bg-foreground",
            );

            const content = (
              <>
                <span className={cn("relative z-10 inline-flex h-6 w-6 items-center justify-center rounded-full sm:h-7 sm:w-7", bookingColor?.date)}>{format(date, "d", { locale: id })}</span>
                {booked ? (
                  <div className="mt-1.5 hidden sm:block">
                    <small className={cn("line-clamp-2 block text-xs font-semibold leading-4", bookingColor?.text)}>
                      {booked.guestName}
                    </small>
                  </div>
                ) : null}
                {isBlockedOnly ? (
                  <div className="mt-1.5 hidden sm:block">
                    <small className="relative z-10 line-clamp-2 block text-xs font-semibold leading-4 text-white/80">
                      {blocked.reason || "Tidak tersedia"}
                    </small>
                  </div>
                ) : null}
                {events.length ? (
                  <div className="absolute right-1 top-1 z-10 flex flex-col items-end gap-0.5 sm:right-2 sm:top-2">
                    {events.slice(0, 2).map((event) => {
                      const eventColor = getBookingColor(event.bookingId);
                      const eventLabel = event.type === "check_in" ? "In" : "Out";

                      return (
                        <span
                          key={`${event.bookingId}-${event.type}`}
                          title={`${eventLabel} - ${event.guestName}`}
                          className={cn(
                            "rounded-full border bg-white px-1 py-0.5 text-[8px] font-black leading-none shadow-sm sm:px-1.5 sm:text-[9px]",
                            eventColor.date,
                          )}
                        >
                          {eventLabel}
                        </span>
                      );
                    })}
                  </div>
                ) : null}
              </>
            );

            return booked ? (
              <Link key={day.date} href={`/bookings/${booked.bookingId}`} className={className}>{content}</Link>
            ) : isBlockedOnly ? (
              <div key={day.date} className={className}>{content}</div>
            ) : (
              <div key={day.date} className={className}>{content}</div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 p-4">
        <span className="inline-flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
          <span className="h-2.5 w-6 rounded-full bg-gradient-to-r from-sky-400 via-violet-400 to-rose-400" />
          Tanggal terisi
        </span>
        <span className="inline-flex items-center gap-2 rounded-2xl border border-foreground bg-foreground px-3 py-1.5 text-xs font-bold text-white">
          <span className="h-2.5 w-2.5 rounded-full bg-white" />
          Tanggal diblokir
        </span>
        <span className="inline-flex items-center gap-2 rounded-2xl border border-border bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground" />
          Tanggal kosong normal
        </span>
      </div>

      <div className="grid gap-4 border-t border-border p-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,1fr)]">
        <form className="grid gap-3 rounded-[20px] border border-border bg-white p-4" onSubmit={createDateBlock}>
          <div>
            <h3 className="text-lg font-black tracking-[-0.03em]">Blok tanggal</h3>
            <p className="mt-1 text-sm text-muted-foreground">Tutup tanggal tertentu untuk maintenance, owner stay, atau kebutuhan lain.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <Label>Tanggal mulai</Label>
              <DatePicker value={blockStartDate} onChange={setBlockStartDate} placeholder="Pilih tanggal mulai" />
            </Field>
            <Field>
              <Label>Tanggal selesai</Label>
              <DatePicker value={blockEndDate} onChange={setBlockEndDate} placeholder="Pilih tanggal selesai" />
            </Field>
          </div>
          <Field>
            <Label>Alasan</Label>
            <Input value={blockReason} onChange={(event) => setBlockReason(event.target.value)} placeholder="Contoh: Maintenance" />
          </Field>
          <Button type="submit" variant="primary" disabled={isBlocking || !propertyId || !blockStartDate || !blockEndDate}>
            {isBlocking ? "Memblokir..." : "Blok Tanggal"}
          </Button>
        </form>

        <div className="rounded-[20px] border border-border bg-white p-4">
          <h3 className="text-lg font-black tracking-[-0.03em]">Blok bulan ini</h3>
          <div className="mt-3 grid gap-2">
            {dateBlocks.length ? dateBlocks.map((block) => (
              <div key={block.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-warning/10 p-3">
                <div>
                  <p className="text-sm font-black text-warning">{formatDateRange(block)}</p>
                  <p className="text-xs text-muted-foreground">{block.reason || "Tanpa alasan"}</p>
                </div>
                <Button type="button" size="sm" onClick={() => deleteDateBlock(block)} disabled={deletingBlockId === block.id}>
                  {deletingBlockId === block.id ? "Menghapus..." : "Hapus"}
                </Button>
              </div>
            )) : (
              <p className="rounded-2xl bg-muted p-3 text-sm text-muted-foreground">Belum ada blok tanggal di bulan ini.</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
