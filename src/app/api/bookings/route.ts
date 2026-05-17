import { handleApiError, jsonOk } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { createBooking, listBookings } from "@/services/booking.service";
import { createBookingSchema } from "@/validators/booking.validator";
import { bookingQuerySchema } from "@/validators/query.validator";

export async function GET(request: Request) {
  try {
    await requireUser();
    const { searchParams } = new URL(request.url);
    const query = bookingQuerySchema.parse({
      startDate: searchParams.get("start_date") ?? undefined,
      endDate: searchParams.get("end_date") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      paymentStatus: searchParams.get("payment_status") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    });

    return jsonOk({ bookings: await listBookings(query) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = createBookingSchema.parse(await request.json());
    return jsonOk(await createBooking(input, user.userId), 201);
  } catch (error) {
    return handleApiError(error);
  }
}
