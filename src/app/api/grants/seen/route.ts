import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { grantId } = await req.json();

  const { error } = await supabase
    .from("user_grant_seen")
    .upsert({
      user_id: session.user.id,
      grant_id: grantId,
    });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}