import { handleApiError } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { readInvoicePdf } from "@/services/invoice.service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await params;
    const { buffer, fileName } = await readInvoicePdf(id);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
