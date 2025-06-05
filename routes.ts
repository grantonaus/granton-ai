  /**
   * An array of routes that are used for authentication
   * These routes will redirect logged-in users to /settings
   */
  export const authRoutes: string[] = [
    "^/login$",
    "^/sign-up$",
    "^/auth/error$",
    "^/forgot-password$",
    "^/new-password$",
    "^/reset-password$",
  ];
  
  /**
   * Dynamic route patterns that require authentication
   */
  export const dynamicAuthRoutes: string[] = [
    "^/new-application$",
    "^/past-applications$",
    "^/company-details$",
    "^/personal-details$",
  ];
  
  /**
   * The prefix for API authentication routes
   */
  export const apiAuthPrefix: string = "/api/auth";
  
  /**
   * The default redirect path after logging in
   */
  export const DEFAULT_LOGIN_REDIRECT: string = "/new-application";
  
  /**
   * Check if a route matches any of the given patterns
   * @param route - The route to check
   * @param patterns - An array of regex patterns
   * @returns True if the route matches any pattern
   */
  export const isRouteMatch = (route: string, patterns: string[]): boolean => {
    return patterns.some((pattern) => new RegExp(pattern).test(route));
  };
  