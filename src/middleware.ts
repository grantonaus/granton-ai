// import { auth } from "../auth";
// import { NextResponse } from "next/server";

// const publicRoutes = [
//   "^/$",
//   "/login",
//   "/sign-up",
//   "/forgot-password",
//   "/reset-password",
//   "/new-password"
// ];

// const protectedRoutes = [
//   "/new-application",
//   "/past-applications",
//   "/company-details",
//   "/personal-details",
//   "/matching-grants"
// ];

// export default auth((req) => {
//   const pathname = req.nextUrl.pathname;
//   const isLoggedIn = !!req.auth;

//   const isPublic = publicRoutes.includes(pathname);
//   const isProtected = protectedRoutes.includes(pathname);

//   // 🔁 If visiting login (or any public page), allow access
//   if (isPublic) return NextResponse.next();

//   // 🔒 If trying to access a protected route without login → redirect to /login
//   if (isProtected && !isLoggedIn) {
//     const url = new URL("/login", req.url);
//     url.searchParams.set("callbackUrl", pathname);
//     return NextResponse.redirect(url);
//   }

//   // 🚧 Optional: If the route doesn't match any known route, redirect
//   const knownRoutes = [...publicRoutes, ...protectedRoutes];
//   if (!knownRoutes.includes(pathname)) {
//     return NextResponse.redirect(new URL("/new-application", req.url));
//   }

//   return NextResponse.next();
// });

// export const config = {
//   matcher: ["/((?!.+\\.[\\w]+$|_next|favicon.ico|api/).*)"],
// };
import { auth } from "../auth";
import { NextResponse } from "next/server";

// Routes any visitor can access:
const PUBLIC_ROUTES = new Set([
  "/",
  "/login",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/new-password",
]);

// Routes ONLY authenticated users can access:
const PROTECTED_ROUTES = new Set([
  "/new-application",
  "/past-applications",
  "/company-details",
  "/personal-details",
  "/matching-grants",
]);

export default auth((req) => {
  const pathname = req.nextUrl.pathname;
  const isLoggedIn = !!req.auth;

  const isPublic = PUBLIC_ROUTES.has(pathname);
  const isProtected = PROTECTED_ROUTES.has(pathname);

  // 1️⃣ The landing page (/) ALWAYS accessible
  if (pathname === "/") {
    return NextResponse.next();
  }

  // 2️⃣ Logged-in users cannot visit login or sign-up
  if (
    isLoggedIn &&
    (pathname === "/login" || pathname === "/sign-up")
  ) {
    return NextResponse.redirect(new URL("/new-application", req.url));
  }

  // 3️⃣ Protected routes → redirect unauthenticated users to /login
  if (isProtected && !isLoggedIn) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // 4️⃣ Public routes → always allowed
  if (isPublic) {
    return NextResponse.next();
  }

  // 5️⃣ Unknown routes → redirect based on authentication state
  const knownRoutes = new Set([...PUBLIC_ROUTES, ...PROTECTED_ROUTES]);

  if (!knownRoutes.has(pathname)) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.redirect(new URL("/new-application", req.url));
  }

  return NextResponse.next();
});

// 🔧 matcher must avoid intercepting _next, static assets, API routes, etc.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\..*$).*)",
  ],
};