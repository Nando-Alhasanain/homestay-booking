import { handleApiError, jsonOk } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { getDashboardStats } from "@/services/dashboard.service";

export async function GET() {
  try {
    await requireUser();
    return jsonOk(await getDashboardStats());
  } catch (error) {
    return handleApiError(error);
  }
}
