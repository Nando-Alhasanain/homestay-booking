import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { getDb } from "@/db";
import { sessions, users } from "@/db/schema";
import { ApiError } from "@/lib/api-response";
import { getSessionMaxAgeSeconds, signSession } from "@/lib/jwt";
import { verifyPassword } from "@/lib/password";
import type { LoginInput } from "@/validators/auth.validator";

export type LoginMetadata = {
  ipAddress?: string;
  userAgent?: string;
};

export async function login(input: LoginInput, metadata: LoginMetadata = {}) {
  const email = input.email.trim().toLowerCase();
  const [user] = await getDb().select().from(users).where(eq(users.email, email)).limit(1);

  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new ApiError("AUTH_INVALID_CREDENTIALS", "Email atau password salah.", 401);
  }

  const sessionId = randomUUID();
  const maxAge = getSessionMaxAgeSeconds();
  const expiresAt = new Date(Date.now() + maxAge * 1000);

  await getDb().insert(sessions).values({
    id: sessionId,
    userId: user.id,
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent,
    expiresAt,
  });

  const token = await signSession({ sessionId, userId: user.id, email: user.email, name: user.name });

  return {
    maxAge,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
}
