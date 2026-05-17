import { jwtVerify, SignJWT } from "jose";

import { getRequiredEnv } from "@/lib/env";

export type SessionPayload = {
  userId: string;
  sessionId: string;
  email: string;
  name: string;
};

export const AUTH_COOKIE_NAME = "homestay_session";

function getSecret() {
  const secret = getRequiredEnv("JWT_SECRET");
  const encoded = new TextEncoder().encode(secret);

  if (encoded.byteLength < 32) {
    throw new Error("JWT_SECRET must be at least 32 bytes");
  }

  return encoded;
}

export function getSessionMaxAgeSeconds() {
  return parseDurationSeconds(process.env.JWT_EXPIRES_IN ?? "7d");
}

function parseDurationSeconds(value: string) {
  const match = /^(\d+)([smhd])?$/.exec(value.trim());

  if (!match) {
    throw new Error("JWT_EXPIRES_IN must use seconds or a simple s/m/h/d suffix");
  }

  const amount = Number(match[1]);
  const unit = match[2] ?? "s";
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 60 * 60, d: 60 * 60 * 24 };

  return amount * multipliers[unit];
}

export async function signSession(payload: SessionPayload) {
  const expiresIn = process.env.JWT_EXPIRES_IN ?? "7d";

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());

    if (
      typeof payload.userId !== "string" ||
      typeof payload.sessionId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string"
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      sessionId: payload.sessionId,
      email: payload.email,
      name: payload.name,
    };
  } catch {
    return null;
  }
}
