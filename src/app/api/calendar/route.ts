import { handleApiError, jsonOk } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { expandCalendarBlocks, listCalendarBlocks } from "@/services/calendar-block.service";
import { listCalendarBookingEvents, listCalendarDates } from "@/services/booking.service";
import { calendarQuerySchema } from "@/validators/query.validator";

export async function GET(request: Request) {
  try {
    await requireUser();
    const { searchParams } = new URL(request.url);
    const query = calendarQuerySchema.parse({
      propertyId: searchParams.get("property_id"),
      month: searchParams.get("month"),
      year: searchParams.get("year"),
    });

    const [bookedDates, bookingEvents, blocks] = await Promise.all([
      listCalendarDates(query),
      listCalendarBookingEvents(query),
      listCalendarBlocks(query),
    ]);

    return jsonOk({
      booked_dates: bookedDates,
      booking_events: bookingEvents,
      blocked_dates: expandCalendarBlocks(blocks, query),
      date_blocks: blocks,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
