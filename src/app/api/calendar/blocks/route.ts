import { handleApiError, jsonOk } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { createCalendarBlock } from "@/services/calendar-block.service";
import { createCalendarBlockSchema } from "@/validators/calendar-block.validator";

export async function POST(request: Request) {
  try {
    await requireUser();
    const input = createCalendarBlockSchema.parse(await request.json());
    return jsonOk({ block: await createCalendarBlock(input) }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
