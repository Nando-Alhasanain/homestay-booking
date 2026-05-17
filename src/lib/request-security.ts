import { ApiError } from "@/lib/api-response";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function assertSameOrigin(request: Request) {
  if (SAFE_METHODS.has(request.method)) return;

  const origin = request.headers.get("origin");
  const expectedOrigin = new URL(request.url).origin;

  if (!origin && process.env.NODE_ENV === "production") {
    throw new ApiError("CSRF_INVALID", "Request tidak valid.", 403);
  }

  if (origin && origin !== expectedOrigin) {
    throw new ApiError("CSRF_INVALID", "Request tidak valid.", 403);
  }
}
