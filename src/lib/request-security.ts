import { ApiError } from "@/lib/api-response";
import { isAllowedOrigin } from "@/lib/origin";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function assertSameOrigin(request: Request) {
  if (SAFE_METHODS.has(request.method)) return;

  const origin = request.headers.get("origin");

  if (!origin && process.env.NODE_ENV === "production") {
    throw new ApiError("CSRF_INVALID", "Request tidak valid.", 403);
  }

  if (origin && !isAllowedOrigin(origin, request.url, request.headers)) {
    throw new ApiError("CSRF_INVALID", "Request tidak valid.", 403);
  }
}
