import { getSession, type SessionUser } from "./auth-custom";
import { verifyJWT } from "./jwt";
import { SESSION_COOKIE_NAME } from "./auth-constants";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

// Helper to get session from cookies (works in both server components and API routes)
async function getSessionFromCookies(cookieHeader?: string | null): Promise<SessionUser | null> {
  try {
    let token: string | undefined;

    if (cookieHeader) {
      const cookieMap = cookieHeader.split(";").reduce((acc, cookie) => {
        const trimmed = cookie.trim();
        const equalIndex = trimmed.indexOf("=");
        if (equalIndex > 0) {
          const name = trimmed.substring(0, equalIndex);
          const value = trimmed.substring(equalIndex + 1);
          acc[name] = decodeURIComponent(value);
        }
        return acc;
      }, {} as Record<string, string>);
      token = cookieMap[SESSION_COOKIE_NAME];
    } else {
      // Use next/headers cookies (server components)
      const cookieStore = await cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    }

    if (!token) {
      return null;
    }

    const payload = await verifyJWT(token);
    if (!payload) return null;
    return payload as unknown as SessionUser;
  } catch (error) {
    console.error("Error getting session from cookies:", error);
    return null;
  }
}

export async function getServerSession(req?: NextRequest): Promise<{ user: SessionUser } | null> {
  try {
    const cookieHeader = req?.headers.get("cookie");
    const session = cookieHeader 
      ? await getSessionFromCookies(cookieHeader)
      : await getSession();
    
    if (!session) {
      return null;
    }
    return { user: session };
  } catch (error) {
    console.error("Error in getServerSession:", error);
    return null;
  }
}
