// import NextAuth from "next-auth";

// import authConfig from "../auth.config";
// import {
//   DEFAULT_LOGIN_REDIRECT,
//   apiAuthPrefix,
//   authRoutes,
//   dynamicAuthRoutes,
//   isRouteMatch,
// } from "../routes";
// import { NextResponse } from "next/server";

// const { auth } = NextAuth(authConfig);

// export default auth((req) => {
//   const { nextUrl } = req;
//   const pathname = nextUrl.pathname;
//   const isLoggedIn = !!req.auth;

//   // Skip middleware for API routes
//   if (pathname.startsWith("/api/")) {
//     return;
//   }

//   // Skip middleware for the webhook route
//   if (pathname.startsWith("/api/webhooks/stripe")) {
//     return;
//   }

//   const isApiAuthRoute = pathname.startsWith(apiAuthPrefix);
//   const isAuthRoute = isRouteMatch(pathname, authRoutes);
//   const isDynamicAuthRoute = isRouteMatch(pathname, dynamicAuthRoutes);

//   if (isApiAuthRoute) {
//     return;
//   }



//   // Handle authentication routes
//   if (isAuthRoute) {
//     if (isLoggedIn) {
//       return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, req.url));
//     }
//     return;
//   }

//   // Protect dynamic auth routes and non-public routes
//   if (!isLoggedIn) {
//     if (isDynamicAuthRoute) {
//       const searchParams = nextUrl.searchParams;
//       if (!searchParams.has("callbackUrl")) {
//         let callbackUrl = pathname;
//         if (nextUrl.search) {
//           callbackUrl += nextUrl.search;
//         }

//         const encodedCallbackUrl = encodeURIComponent(callbackUrl);

//         return NextResponse.redirect(
//           new URL(`/login?callbackUrl=${encodedCallbackUrl}`, req.url)
//         );
//       }
//     }
//   }

//   // Check if the page exists; redirect to /home if not
//   const validRoutesPatterns = [
//     ...authRoutes,
//     ...dynamicAuthRoutes,
//   ];

//   const isValidRoute = isRouteMatch(pathname, validRoutesPatterns);

//   if (!isValidRoute) {
//     return NextResponse.redirect(new URL("/new-application", req.url));
//   }

//   return;
// });

// // Optionally, don't invoke Middleware on some paths
// export const config = {
//   matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
// };


// middleware.ts
import { auth } from "../auth";
import { NextResponse } from "next/server";

const publicRoutes = [
  "/login",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/new-password"
];

const protectedRoutes = [
  "/new-application",
  "/past-applications",
  "/company-details",
  "/personal-details",
  "/matching-grants"
];

export default auth((req) => {
  const pathname = req.nextUrl.pathname;
  const isLoggedIn = !!req.auth;

  const isPublic = publicRoutes.includes(pathname);
  const isProtected = protectedRoutes.includes(pathname);

  // 🔁 If visiting login (or any public page), allow access
  if (isPublic) return NextResponse.next();

  // 🔒 If trying to access a protected route without login → redirect to /login
  if (isProtected && !isLoggedIn) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // 🚧 Optional: If the route doesn't match any known route, redirect
  const knownRoutes = [...publicRoutes, ...protectedRoutes];
  if (!knownRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/new-application", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
