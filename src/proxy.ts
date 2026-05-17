import { NextResponse, type NextRequest } from "next/server";

import { isAllowedOrigin } from "@/lib/origin";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/") && !SAFE_METHODS.has(request.method)) {
    const origin = request.headers.get("origin");

    if ((process.env.NODE_ENV === "production" && !origin) || (origin && !isAllowedOrigin(origin, request.url, request.headers))) {
      return NextResponse.json({ error: "CSRF_INVALID", message: "Request tidak valid." }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
