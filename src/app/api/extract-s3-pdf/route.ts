import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import { requireAuth } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";
import {
  assertContentLengthOk,
  assertUrlSafeForServerFetch,
  MAX_JSON_BODY_BYTES,
} from "@/lib/url-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    assertContentLengthOk(request, MAX_JSON_BODY_BYTES);
  } catch {
    return NextResponse.json({ error: "Request body too large" }, { status: 413 });
  }

  const rl = rateLimit(`extract_s3_pdf:${auth.user.id}`, 60, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  try {
    const body = await request.json();
    const { fileUrl } = body as { fileUrl?: string };

    if (!fileUrl || typeof fileUrl !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'fileUrl' in request body" },
        { status: 400 }
      );
    }

    const safe = await assertUrlSafeForServerFetch(fileUrl);
    const response = await fetch(safe.href);
    if (!response.ok) {
      console.error(
        `[extract-s3-pdf] Failed to fetch ${safe.href}: ${response.status}`
      );
      return NextResponse.json(
        { error: `Failed to fetch PDF (status ${response.status})` },
        { status: 502 }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let parsed;
    try {
      parsed = await pdfParse(buffer);
    } catch (parseErr: unknown) {
      console.error("[extract-s3-pdf] pdf-parse error:", parseErr);
      return NextResponse.json({ error: "Error parsing PDF" }, { status: 500 });
    }

    const text = (parsed.text || "").trim();
    return NextResponse.json({ text }, { status: 200 });
  } catch (err: unknown) {
    console.error("[extract-s3-pdf] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
