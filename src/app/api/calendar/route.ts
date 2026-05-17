import { handleApiError, jsonOk } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { listCalendarDates } from "@/services/booking.service";
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

    return jsonOk({ booked_dates: await listCalendarDates(query) });
  } catch (error) {
    return handleApiError(error);
  }
}
