import { handleApiError, jsonOk } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { cancelBooking, getBookingById, updateBooking } from "@/services/booking.service";
import { updateBookingSchema } from "@/validators/booking.validator";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await params;
    return jsonOk({ booking: await getBookingById(id) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await params;
    const input = updateBookingSchema.parse(await request.json());
    return jsonOk({ booking: await updateBooking(id, input) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await params;
    return jsonOk({ booking: await cancelBooking(id) });
  } catch (error) {
    return handleApiError(error);
  }
}
