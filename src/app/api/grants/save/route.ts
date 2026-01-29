import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.id;
    const { grantId } = await req.json();

    if (!grantId) {
      return NextResponse.json({ error: "grantId is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("user_saved_grants")
      .upsert(
        {
          user_id: userId,
          grant_id: grantId,
        },
        {
          onConflict: "user_id,grant_id",
        }
      );

    if (error) {
      console.error("Save grant error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error saving grant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}