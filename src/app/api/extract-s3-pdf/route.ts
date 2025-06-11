// File: app/api/extract-s3-pdf/route.ts

import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";

export const runtime = "nodejs"; // ensure we run in Node environment
export const dynamic = "force-dynamic"; // no caching, always fresh

/**
 * Expected request body: { fileUrl: string }
 * Example:
 *   POST /api/extract-s3-pdf
 *   {
 *     "fileUrl": "https://your-bucket.s3.amazonaws.com/path/to/document.pdf"
 *   }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileUrl } = body as { fileUrl?: string };

    if (!fileUrl || typeof fileUrl !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'fileUrl' in request body" },
        { status: 400 }
      );
    }

    // 1) Fetch the PDF from S3
    const response = await fetch(fileUrl);
    if (!response.ok) {
      console.error(`[extract-s3-pdf] Failed to fetch ${fileUrl}: ${response.status}`);
      return NextResponse.json(
        { error: `Failed to fetch PDF (status ${response.status})` },
        { status: 502 }
      );
    }

    // 2) Read the response as an ArrayBuffer and convert to Buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3) Use pdf-parse to extract text
    let parsed;
    try {
      parsed = await pdfParse(buffer);
    } catch (parseErr: any) {
      console.error("[extract-s3-pdf] pdf-parse error:", parseErr);
      return NextResponse.json(
        { error: "Error parsing PDF" },
        { status: 500 }
      );
    }

    const text = (parsed.text || "").trim();
    return NextResponse.json({ text }, { status: 200 });
  } catch (err: any) {
    console.error("[extract-s3-pdf] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: err.message || String(err) },
      { status: 500 }
    );
  }
}
