import { cookies } from "next/headers";
import { and, eq, gt, isNull } from "drizzle-orm";

import { getDb } from "@/db";
import { sessions } from "@/db/schema";
import { ApiError } from "@/lib/api-response";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/jwt";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) return null;

  const payload = await verifySessionToken(token);

  if (!payload) return null;

  const [session] = await getDb()
    .select({ id: sessions.id })
    .from(sessions)
    .where(
      and(
        eq(sessions.id, payload.sessionId),
        eq(sessions.userId, payload.userId),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!session) return null;

  return payload;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new ApiError("AUTH_UNAUTHORIZED", "Anda harus login terlebih dahulu.", 401);
  }

  return user;
}

export async function revokeCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const payload = token ? await verifySessionToken(token) : null;

  if (payload) {
    await getDb()
      .update(sessions)
      .set({ revokedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(sessions.id, payload.sessionId), eq(sessions.userId, payload.userId)));
  }

  cookieStore.delete(AUTH_COOKIE_NAME);
}
