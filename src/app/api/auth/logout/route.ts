import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth-custom";

export async function POST() {
  await deleteSession();
  return NextResponse.json({ success: true });
}
