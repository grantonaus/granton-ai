/**
 * Resolves the HMAC secret for JWT signing. In production, missing env is fatal.
 * In development, a loud fallback allows local work without copying secrets.
 */
let devFallbackWarned = false;

export function getAuthSecret(): string {
  const s =
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.BETTER_AUTH_SECRET?.trim() ||
    "";

  if (s.length > 0) {
    return s;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXTAUTH_SECRET or BETTER_AUTH_SECRET must be set in production."
    );
  }

  const devOnly =
    "dev-insecure-granton-auth-secret-min-32-chars-change-me";
  if (!devFallbackWarned) {
    devFallbackWarned = true;
    console.warn(
      "[auth] NEXTAUTH_SECRET / BETTER_AUTH_SECRET not set; using insecure development-only default."
    );
  }
  return devOnly;
}

if (process.env.NODE_ENV === "production") {
  getAuthSecret();
}
