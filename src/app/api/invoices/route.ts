import { handleApiError, jsonOk } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { listInvoices } from "@/services/invoice.service";

export async function GET(request: Request) {
  try {
    await requireUser();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? undefined;

    return jsonOk({ invoices: await listInvoices(search) });
  } catch (error) {
    return handleApiError(error);
  }
}
