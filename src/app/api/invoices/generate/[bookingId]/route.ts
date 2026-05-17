import { handleApiError, jsonOk } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { generateInvoiceForBooking } from "@/services/invoice.service";

export async function POST(_request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    await requireUser();
    const { bookingId } = await params;
    return jsonOk({ invoice: await generateInvoiceForBooking(bookingId) });
  } catch (error) {
    return handleApiError(error);
  }
}
