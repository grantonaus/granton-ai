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

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    assertContentLengthOk(request, MAX_JSON_BODY_BYTES);
  } catch {
    return NextResponse.json({ error: "Request body too large" }, { status: 413 });
  }

  const rl = rateLimit(`s3_pdf_extract:${auth.user.id}`, 60, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  try {
    const { url } = (await request.json()) as { url?: string };
    if (!url) {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    const safe = await assertUrlSafeForServerFetch(url);
    const fetchRes = await fetch(safe.href);
    if (!fetchRes.ok) {
      return NextResponse.json(
        { error: `Failed to fetch PDF: ${fetchRes.status}` },
        { status: 500 }
      );
    }

    const arrayBuffer = await fetchRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { text } = await pdfParse(buffer);

    return NextResponse.json({ extractedText: text.trim() }, { status: 200 });
  } catch (err: unknown) {
    console.error("Error extracting from public PDF URL:", err);
    return NextResponse.json(
      { error: "Could not extract text" },
      { status: 500 }
    );
  }
}
