import { handleApiError, jsonOk } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { getInvoiceById } from "@/services/invoice.service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await params;
    return jsonOk(await getInvoiceById(id));
  } catch (error) {
    return handleApiError(error);
  }
}
