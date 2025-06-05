import NextAuth from "next-auth";

import authConfig from "../auth.config";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  dynamicAuthRoutes,
  isRouteMatch,
} from "../routes";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const isLoggedIn = !!req.auth;

  // Skip middleware for API routes
  if (pathname.startsWith("/api/")) {
    return;
  }

  // Skip middleware for the webhook route
  if (pathname.startsWith("/api/webhooks/stripe")) {
    return;
  }

  const isApiAuthRoute = pathname.startsWith(apiAuthPrefix);
  const isAuthRoute = isRouteMatch(pathname, authRoutes);
  const isDynamicAuthRoute = isRouteMatch(pathname, dynamicAuthRoutes);

  if (isApiAuthRoute) {
    return;
  }



  // Handle authentication routes
  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, req.url));
    }
    return;
  }

  // Protect dynamic auth routes and non-public routes
  if (!isLoggedIn) {
    if (isDynamicAuthRoute) {
      const searchParams = nextUrl.searchParams;
      if (!searchParams.has("callbackUrl")) {
        let callbackUrl = pathname;
        if (nextUrl.search) {
          callbackUrl += nextUrl.search;
        }

        const encodedCallbackUrl = encodeURIComponent(callbackUrl);

        return NextResponse.redirect(
          new URL(`/login?callbackUrl=${encodedCallbackUrl}`, req.url)
        );
      }
    }
  }

  // Check if the page exists; redirect to /home if not
  const validRoutesPatterns = [
    ...authRoutes,
    ...dynamicAuthRoutes,
  ];

  const isValidRoute = isRouteMatch(pathname, validRoutesPatterns);

  if (!isValidRoute) {
    return NextResponse.redirect(new URL("/new-application", req.url));
  }

  return;
});

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};