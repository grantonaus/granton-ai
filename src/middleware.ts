import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOGIN_REDIRECT, authRoutes, publicRoutes } from "../routes";
import { verifyJWT } from "./lib/jwt";
import { SESSION_COOKIE_NAME } from "./lib/auth-constants";

async function getSessionFromRequest(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return null;
    }
    return await verifyJWT(token);
  } catch {
    return null;
  }
}

const HIDDEN_APP_ROUTES = ["/new-application", "/past-applications"];

export default async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const path = nextUrl.pathname;

  if (
    HIDDEN_APP_ROUTES.some(
      (p) => path === p || path.startsWith(`${p}/`)
    )
  ) {
    return NextResponse.redirect(new URL("/grant-database", nextUrl));
  }

  if (path.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (path.startsWith("/api/stripe/webhook")) {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(req);
  const isLoggedIn = !!session;
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.some((route) => new RegExp(route).test(nextUrl.pathname));

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn && !isPublicRoute) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }

    const encodedCallbackUrl = encodeURIComponent(callbackUrl);

    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodedCallbackUrl}`, nextUrl)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
