import { cookies } from "next/headers";

import { handleApiError, jsonOk } from "@/lib/api-response";
import { AUTH_COOKIE_NAME } from "@/lib/jwt";
import { assertRateLimit, getClientIp } from "@/lib/rate-limit";
import { assertSameOrigin } from "@/lib/request-security";
import { login } from "@/services/auth.service";
import { loginSchema } from "@/validators/auth.validator";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const ipAddress = getClientIp(request);
    assertRateLimit(`login:${ipAddress}`, { limit: 10, windowMs: 15 * 60 * 1000 });

    const input = loginSchema.parse(await request.json());
    const result = await login(input, {
      ipAddress,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    const cookieStore = await cookies();

    cookieStore.set(AUTH_COOKIE_NAME, result.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: result.maxAge,
    });

    return jsonOk({ user: result.user });
  } catch (error) {
    return handleApiError(error);
  }
}
