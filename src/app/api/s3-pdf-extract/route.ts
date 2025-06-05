import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";

export async function POST(request: NextRequest) {
  try {
    const { url } = (await request.json()) as { url?: string };
    if (!url) {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    // 1) Download PDF bytes directly via fetch
    const fetchRes = await fetch(url);
    if (!fetchRes.ok) {
      return NextResponse.json(
        { error: `Failed to fetch PDF: ${fetchRes.status}` },
        { status: 500 }
      );
    }

    // 2) Read into ArrayBuffer → Buffer
    const arrayBuffer = await fetchRes.arrayBuffer();
    const buffer      = Buffer.from(arrayBuffer);

    // 3) Parse with pdf-parse
    const { text } = await pdfParse(buffer);

    return NextResponse.json({ extractedText: text.trim() }, { status: 200 });
  } catch (err: any) {
    console.error("Error extracting from public PDF URL:", err);
    return NextResponse.json(
      { error: "Could not extract text", details: err.message },
      { status: 500 }
    );
  }
}
