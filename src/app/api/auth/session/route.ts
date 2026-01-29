import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-custom";

export async function GET() {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json(null, { status: 401 });
  }

  return NextResponse.json({
    user: session,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
  });
}
