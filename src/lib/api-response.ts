import { ZodError } from "zod";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "CSRF_INVALID"
  | "AUTH_INVALID_CREDENTIALS"
  | "AUTH_UNAUTHORIZED"
  | "BOOKING_CONFLICT"
  | "BOOKING_NOT_FOUND"
  | "PROPERTY_NOT_FOUND"
  | "INVOICE_GENERATION_FAILED"
  | "INVOICE_NOT_FOUND"
  | "INTERNAL_SERVER_ERROR";

export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export function jsonOk<T>(data: T, status = 200) {
  return Response.json(data, { status });
}

export function jsonError(code: ApiErrorCode, message: string, status = 400) {
  return Response.json({ error: code, message }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return jsonError(error.code, error.message, error.status);
  }

  if (error instanceof ZodError) {
    return jsonError("VALIDATION_ERROR", error.issues[0]?.message ?? "Invalid request", 422);
  }

  console.error(error);
  return jsonError("INTERNAL_SERVER_ERROR", "Terjadi kesalahan server.", 500);
}
