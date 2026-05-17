import { handleApiError, jsonOk } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    return jsonOk({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
