import { handleApiError, jsonOk } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { deleteCalendarBlock } from "@/services/calendar-block.service";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await params;
    return jsonOk({ block: await deleteCalendarBlock(id) });
  } catch (error) {
    return handleApiError(error);
  }
}
