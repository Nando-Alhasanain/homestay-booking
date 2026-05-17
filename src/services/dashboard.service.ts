import { and, gte, lt, ne } from "drizzle-orm";

import { getDb } from "@/db";
import { bookings } from "@/db/schema";

export async function getDashboardStats() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10);

  const rows = await getDb().select().from(bookings).where(ne(bookings.bookingStatus, "cancelled"));
  const monthRows = await getDb()
    .select()
    .from(bookings)
    .where(and(ne(bookings.bookingStatus, "cancelled"), gte(bookings.checkIn, monthStart), lt(bookings.checkIn, nextMonth)));

  return {
    active_bookings: rows.filter((booking) => ["pending", "confirmed", "checked_in"].includes(booking.bookingStatus)).length,
    today_check_ins: rows.filter((booking) => booking.checkIn === today).length,
    today_check_outs: rows.filter((booking) => booking.checkOut === today).length,
    upcoming_bookings: rows.filter((booking) => booking.checkIn > today).length,
    unpaid_bookings: rows.filter((booking) => booking.paymentStatus !== "paid").length,
    monthly_revenue: monthRows.reduce((total, booking) => total + Number(booking.paidAmount), 0),
  };
}
