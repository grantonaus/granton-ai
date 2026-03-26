/**
 * Routes that do not require authentication.
 */
export const publicRoutes = ["/", "/auth/new-verification"];

/**
 * Auth pages (login, sign-up, etc.). Logged-in users are redirected away.
 */
export const authRoutes = [
  "^/login$",
  "^/sign-up$",
  "^/auth/error$",
  "^/forgot-password$",
  "^/new-password$",
  "^/reset-password$",
];

export const apiAuthPrefix = "/api/auth";

export const DEFAULT_LOGIN_REDIRECT = "/grant-database";
