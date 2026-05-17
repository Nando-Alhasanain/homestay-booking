import { revokeCurrentSession } from "@/lib/auth";
import { handleApiError, jsonOk } from "@/lib/api-response";
import { assertSameOrigin } from "@/lib/request-security";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await revokeCurrentSession();

    return jsonOk({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
