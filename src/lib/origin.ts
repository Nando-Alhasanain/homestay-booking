function toOrigin(value: string | null | undefined) {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

export function getAllowedOrigins(requestUrl: string, headers: Headers) {
  const origins = new Set<string>();
  const requestOrigin = toOrigin(requestUrl);
  const appOrigin = toOrigin(process.env.NEXT_PUBLIC_APP_URL);
  const forwardedProto = firstHeaderValue(headers.get("x-forwarded-proto"));
  const forwardedHost = firstHeaderValue(headers.get("x-forwarded-host")) ?? firstHeaderValue(headers.get("host"));

  if (requestOrigin) origins.add(requestOrigin);
  if (appOrigin) origins.add(appOrigin);
  if (forwardedProto && forwardedHost) origins.add(`${forwardedProto}://${forwardedHost}`);

  return origins;
}

export function isAllowedOrigin(origin: string | null, requestUrl: string, headers: Headers) {
  const normalizedOrigin = toOrigin(origin);

  if (!normalizedOrigin) return false;

  return getAllowedOrigins(requestUrl, headers).has(normalizedOrigin);
}
