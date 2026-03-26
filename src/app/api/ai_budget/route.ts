import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import fetch from "node-fetch";
import pdfParse from "pdf-parse";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { requireAuth } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";
import {
  assertContentLengthOk,
  assertFileSizeOk,
  assertUrlSafeForServerFetch,
  MAX_FORM_FILE_BYTES,
} from "@/lib/url-safety";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    assertContentLengthOk(request, 50 * 1024 * 1024);
  } catch {
    return NextResponse.json({ error: "Request body too large" }, { status: 413 });
  }

  const rl = rateLimit(`ai_budget:${auth.user.id}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  try {
    const formData = await request.formData();

    const guidelinesLink = formData.get("guidelinesLink")?.toString() || "";
    const applicationFormLink =
      formData.get("applicationFormLink")?.toString() || "";
    const guidelinesFile = formData.get("guidelinesFile");
    const applicationFormFile = formData.get("applicationFormFile");

    const extractTextFromWeb = async (url: string): Promise<string> => {
      const safe = await assertUrlSafeForServerFetch(url);
      const res = await fetch(safe.href);
      if (!res.ok) {
        throw new Error(`Failed to fetch (status ${res.status})`);
      }

      const html = await res.text();
      const $ = cheerio.load(html);

      const text = $("article").text() || $("body").text();

      return text
        .replace(/(\w+)-\s+(\w+)/g, "$1$2")
        .replace(/\s{2,}/g, " ")
        .replace(/[^a-zA-Z0-9.,!?\s]/g, "")
        .trim();
    };

    let guidelinesTextFile = "";
    let applicationTextFile = "";

    if (guidelinesFile instanceof File) {
      assertFileSizeOk(guidelinesFile, MAX_FORM_FILE_BYTES);
      const buffer = Buffer.from(await guidelinesFile.arrayBuffer());
      const parsed = await pdfParse(buffer);
      guidelinesTextFile = parsed.text || "";
    }

    if (applicationFormFile instanceof File) {
      assertFileSizeOk(applicationFormFile, MAX_FORM_FILE_BYTES);
      const buffer = Buffer.from(await applicationFormFile.arrayBuffer());
      const parsed = await pdfParse(buffer);
      applicationTextFile = parsed.text || "";
    }

    const results: Record<string, string> = {};

    if (guidelinesLink.trim()) {
      try {
        results.guidelinesText = await extractTextFromWeb(guidelinesLink);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn(`[guidelinesLink] Skipped due to error: ${msg}`);
      }
    }

    if (typeof applicationFormLink === "string" && applicationFormLink.trim()) {
      try {
        results.applicationFormText = await extractTextFromWeb(
          applicationFormLink
        );
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn(`[applicationFormLink] Skipped due to error: ${msg}`);
      }
    }

    const combinedInputSections: string[] = [];
    if (guidelinesTextFile.trim()) {
      combinedInputSections.push(
        `---\nGUIDELINES (file):\n${guidelinesTextFile.trim()}`
      );
    }
    if (results.guidelinesText?.trim()) {
      combinedInputSections.push(
        `---\nGUIDELINES (link):\n${results.guidelinesText.trim()}`
      );
    }
    if (applicationTextFile.trim()) {
      combinedInputSections.push(
        `---\nAPPLICATION FORM (file):\n${applicationTextFile.trim()}`
      );
    }
    if (results.applicationFormText?.trim()) {
      combinedInputSections.push(
        `---\nAPPLICATION FORM (link):\n${results.applicationFormText.trim()}`
      );
    }

    const aiInput = combinedInputSections.join("\n\n");

    const systemPrompt = `
You are an expert grant analysis assistant.

Your task is to extract only two things from the provided grant guidelines and/or application form:

1. A concise list of eligible expenses
2. Whether matched funding is required, and how much

📥 INPUTS (Combined text from provided sources):
${aiInput}

📝 OUTPUT FORMAT:
Keep it brief and structured exactly like this example:

Eligible Expenses include:
- Staff salaries directly related to the project
- Equipment and software essential for delivery
- Subcontractor fees (must be project-specific)
- Travel (capped at 10% of total project costs)
- Marketing and launch activities (must be tied to project outcomes)

Co-contribution / Matched Funding required: 20%

✅ If matched funding is not required, state:
Co-contribution / Matched Funding required: None

Be precise. Use exact language from the guidelines where relevant. If caps or conditions are specified (e.g. "not more than 20%" or "must be Australian-based"), include those next to the line item.
`;

    const aiResponse = await generateText({
      model: openai("gpt-4.1-nano"),
      prompt: systemPrompt,
    });

    const aiResult = aiResponse?.text?.trim() || "";

    return NextResponse.json(
      {
        aiGrantExtraction: aiResult,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("Unexpected error in ai_budget API:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
