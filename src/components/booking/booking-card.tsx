import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  bookingStatusLabel,
  bookingStatusTone,
  formatCurrency,
  formatDateRange,
  paymentStatusLabel,
  paymentStatusTone,
} from "@/lib/utils";
import type { Booking } from "@/types";

export function BookingCard({ booking }: { booking: Booking }) {
  return (
    <Link
      href={`/bookings/${booking.id}`}
      className="grid gap-3 rounded-[18px] border border-border bg-white p-4 transition hover:border-foreground/40 sm:grid-cols-[minmax(0,1fr)_auto]"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="truncate">{booking.guestName}</strong>
          <Badge tone={bookingStatusTone(booking.bookingStatus)}>
            {bookingStatusLabel(booking.bookingStatus)}
          </Badge>
        </div>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {formatDateRange(booking.checkIn, booking.checkOut)} · {booking.guestCount} tamu · {booking.propertyName ?? "Property"}
        </p>
      </div>
      <div className="text-left font-black tabular-nums sm:text-right">
        {formatCurrency(booking.totalPrice)}
        <div className="mt-1">
          <Badge tone={paymentStatusTone(booking.paymentStatus)}>
            {paymentStatusLabel(booking.paymentStatus)}
          </Badge>
        </div>
      </div>
    </Link>
  );
}
