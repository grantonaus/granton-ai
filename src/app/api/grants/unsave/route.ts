import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const session = await auth();

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
      .delete()
      .eq("user_id", userId)
      .eq("grant_id", grantId);

    if (error) {
      console.error("Unsave grant error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error unsaving grant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}