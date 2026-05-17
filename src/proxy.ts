import { NextResponse, type NextRequest } from "next/server";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/") && !SAFE_METHODS.has(request.method)) {
    const origin = request.headers.get("origin");
    const expectedOrigin = request.nextUrl.origin;

    if ((process.env.NODE_ENV === "production" && !origin) || (origin && origin !== expectedOrigin)) {
      return NextResponse.json({ error: "CSRF_INVALID", message: "Request tidak valid." }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
