// /**
//  * An array of routes that are used for authentication
//  * These routes will redirect logged-in users to /settings
//  */
// export const authRoutes: string[] = [
// "^/login",
// "^/login$",
// "^/sign-up$",
// "^/auth/erroxr$",
// "^/forgot-password$",
// "^/new-password$",
// "^/reset-password$",
// ];

// /**
//  * Dynamic route patterns that require authentication
//  */
// export const dynamicAuthRoutes: string[] = [
//   "^/new-application$",
//   "^/past-applications$",
//   "^/company-details$",
//   "^/personal-details$",
//   "^/matching-grants$",
// ];

// /**
//  * The prefix for API authentication routes
//  */
// export const apiAuthPrefix: string = "/api/auth";

// /**
//  * The default redirect path after logging in
//  */
// export const DEFAULT_LOGIN_REDIRECT: string = "/new-application";

// /**
//  * Check if a route matches any of the given patterns
//  * @param route - The route to check
//  * @param patterns - An array of regex patterns
//  * @returns True if the route matches any pattern
//  */
// export const isRouteMatch = (route: string, patterns: string[]): boolean => {
//   return patterns.some((pattern) => new RegExp(pattern).test(route));
// };



/**
* An array of routes that are accessible to the public
* These routes do not require authentication
* @type {string[]}
*/
export const publicRoutes = [
  "/",
  "/auth/new-verification"
];

/**
 * An array of routes that are used for authentication
 * These routes will redirect logged in users to /settings
 * @type {string[]}
 */
export const authRoutes = [
  "^/login$",
  "^/sign-up$",
  "^/auth/erroxr$",
  "^/forgot-password$",
  "^/new-password$",
  "^/reset-password$",
];

/**
 * The prefix for API authentication routes
 * Routes that start with this prefix are used for API authentication purposes
 * @type {string}
 */
export const apiAuthPrefix = "/api/auth";

/**
 * The default redirect path after logging in
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT = "/new-application";