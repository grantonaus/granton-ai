import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import type { SessionUser } from "@/lib/auth-custom";

export type AuthResult =
  | { ok: true; user: SessionUser }
  | { ok: false; response: NextResponse };

/**
 * Require a logged-in user for API routes. Always pass the request so cookies are read correctly.
 */
export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  const session = await getServerSession(req);
  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true, user: session.user };
}
