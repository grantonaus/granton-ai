
// File: /app/api/extract_questions_chat/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import pdfParse from "pdf-parse";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * ─── Helper: Scrape plain text from a URL ───────────────────────────────
 */
async function extractTextFromWeb(url: string): Promise<string> {
  console.log(`[extractTextFromWeb] Fetching URL: ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    const msg = `Failed to fetch ${url} (status ${res.status})`;
    console.error(`[extractTextFromWeb] ${msg}`);
    throw new Error(msg);
  }
  const html = await res.text();
  const $ = cheerio.load(html);
  const text = $("article").text() || $("body").text();
  console.log(`[extractTextFromWeb] Extracted ${text.length} chars from web.`);
  return text
    .replace(/(\w+)-\s+(\w+)/g, "$1$2") // glue broken hyphens
    .replace(/\s{2,}/g, " ")           // collapse multiple spaces
    .replace(/[^a-zA-Z0-9.,!?\s]/g, "") // strip non‐printables
    .trim();
}

/**
 * ─── Helper: Extract plain text from a PDF File ──────────────────────────
 */
async function extractTextFromPDF(file: File): Promise<string> {
  console.log(`[extractTextFromPDF] Parsing PDF: ${file.name} (${file.size} bytes)`);
  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = await pdfParse(buffer);
  const text = parsed.text || "";
  console.log(`[extractTextFromPDF] Extracted ${text.length} chars from PDF.`);
  return text.trim();
}

/**
 * ─── Zod schema for JSON‐only “chat continuation” ───────────────────────
 * This is used on subsequent calls once “form text” is already in the system prompt.
 */
const chatContinuationSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.string().min(1),
    })
  ),
});

export const NextQuestionSchema = z.object({
  fieldKey: z.string().nonempty().describe("internal field identifier"),
  text: z.string().nonempty().describe("the text of the question to ask"),
});


export async function POST(request: Request) {
  console.log("[/api/extract_questions_chat] → Received request");

  let messages: { role: "system" | "user" | "assistant"; content: string }[] = [];
  let combinedFormText = "";

  try {
    const contentType = request.headers.get("content-type") || "";
    console.log(`[Parsing] Content-Type: ${contentType}`);

    if (contentType.startsWith("multipart/form-data")) {
      // ── (A) This is the FIRST call: client uploads ALL Steps1–3 fields + messages[] JSON
      const formData = await request.formData();

      // 1) Extract JSON‐encoded `messages[]`
      const messagesJson = formData.get("messages") as string;
      messages = JSON.parse(messagesJson);

      // ── Step 1: COMPANY TEXT FIELDS ─────────────────────────────────────
      const websiteUrl = (formData.get("website_url") as string) || "";
      const companyName = (formData.get("company_name") as string) || "";
      const country = (formData.get("country") as string) || "";
      const companyBackground = (formData.get("company_background") as string) || "";
      const product = (formData.get("product") as string) || "";
      const competitorsUVP = (formData.get("competitors_unique_value_proposition") as string) || "";
      const currentStage = (formData.get("current_stage") as string) || "";
      const mainObjective = (formData.get("main_objective") as string) || "";
      const targetCustomers = (formData.get("target_customers") as string) || "";
      const fundingStatus = (formData.get("funding_status") as string) || "";

      // ── Step 1: COMPANY ATTACHMENTS ───────────────────────────────────────
      const companyAttachmentTexts: string[] = [];
      let idx = 0;
      while (true) {
        const fileKey = `companyAttachmentFile_${idx}`;
        const urlKey = `companyAttachmentUrl_${idx}`;
        if (formData.has(fileKey)) {
          const file = formData.get(fileKey) as File;
          try {
            const pdfText = await extractTextFromPDF(file);
            companyAttachmentTexts.push(
              `COMPANY ATTACHMENT (PDF: ${file.name}):\n${pdfText}`
            );
          } catch (e: any) {
            console.error(`[extract_questions_chat] Error parsing ${fileKey}:`, e);
            companyAttachmentTexts.push(
              `COMPANY ATTACHMENT (PDF: ${file.name}) parse error: ${e.message}`
            );
          }
          idx++;
          continue;
        } else if (formData.has(urlKey)) {
          const s3url = formData.get(urlKey) as string;
          try {
            const webText = await extractTextFromWeb(s3url);
            companyAttachmentTexts.push(
              `COMPANY ATTACHMENT (URL: ${s3url}):\n${webText}`
            );
          } catch (e: any) {
            console.error(`[extract_questions_chat] Error fetching ${urlKey}:`, e);
            companyAttachmentTexts.push(
              `COMPANY ATTACHMENT (URL: ${s3url}) fetch error: ${e.message}`
            );
          }
          idx++;
          continue;
        }
        break;
      }

      // ── Step 2: GRANT FIELDS ───────────────────────────────────────────────

      const grantLink = (formData.get("grant_link") as string) || "";
      const amountApplyingFor = (formData.get("amount_applying_for") as string) || "";
      const guidelinesFile = formData.get("guidelinesFile") as File | null;
      const guidelinesLink = (formData.get("guidelinesLink") as string) || "";
      const applicationFormFile = formData.get("applicationFormFile") as File | null;
      const applicationFormLink = (formData.get("applicationFormLink") as string) || "";

      // ── Step 3: BUDGET FIELD ──────────────────────────────────────────────
      const allocationDetails = (formData.get("allocation_details") as string) || "";

      let companyWebsiteText = "";
      if (websiteUrl.trim()) {
        companyWebsiteText = await extractTextFromWeb(websiteUrl.trim());
        console.log(`[extract_questions_chat] Extracted ${companyWebsiteText.length} chars from company website.`);
      }

      // ── (B) Extract text from Grant Guidelines (PDF or link)
      let guidelinesText = "";
      if (guidelinesFile && guidelinesFile.size > 0) {
        guidelinesText = await extractTextFromPDF(guidelinesFile);
      } else if (guidelinesLink.trim()) {
        guidelinesText = await extractTextFromWeb(guidelinesLink.trim());
      }

      // ── (C) Extract text from Application Form (PDF or link)
      let applicationFormText = "";
      if (applicationFormFile && applicationFormFile.size > 0) {
        applicationFormText = await extractTextFromPDF(applicationFormFile);
      } else if (applicationFormLink.trim()) {
        applicationFormText = await extractTextFromWeb(applicationFormLink.trim());
      }

      // ── (D) Build combinedFormText exactly like /api/extract_all_text did
      const sections: string[] = [];

      // 1) COMPANY DETAILS
      sections.push(`---\nCOMPANY DETAILS:
- Name: ${companyName}
- Website: ${websiteUrl}
- Country: ${country}
- Background: ${companyBackground}
- Product: ${product}
- Competitors/UVP: ${competitorsUVP}
- Current Stage: ${currentStage}
- Main Objective: ${mainObjective}
- Target Customers: ${targetCustomers}
- Funding Status: ${fundingStatus}
- COMPANY WEBSITE TEXT: ${companyWebsiteText}`);


      // 2) GRANT DETAILS
      sections.push(`---\nGRANT DETAILS:
- Grant Link: ${grantLink}
- Amount Applying For: ${amountApplyingFor}`);

      // 3) COMPANY ATTACHMENTS (if any)
      if (companyAttachmentTexts.length > 0) {
        sections.push(`---\nCOMPANY ATTACHMENTS:\n${companyAttachmentTexts.join("\n\n")}`);
      }

      // 4) BUDGET DETAILS
      sections.push(`---\nBUDGET DETAILS:
- Allocation Details: ${allocationDetails}`);

      // 5) GRANT GUIDELINES TEXT (if any)
      if (guidelinesText.trim()) {
        sections.push(`---\nGRANT GUIDELINES TEXT:\n${guidelinesText}`);
      }

      // 6) APPLICATION FORM TEXT (if any)
      if (applicationFormText.trim()) {
        sections.push(`---\nAPPLICATION FORM TEXT:\n${applicationFormText}`);
      }

      combinedFormText = sections.join("\n\n");
      console.log(
        "[/api/extract_questions_chat] CombinedFormText length:",
        combinedFormText.length
      );


    } else {
      // ── (E) Subsequent calls: JSON‐only containing messages[]. The "system" step
      //     already baked combinedFormText into messages[0].content.
      const body = await request.json();
      const parsed = chatContinuationSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid JSON format", details: parsed.error.format() },
          { status: 400 }
        );
      }
      messages = parsed.data.messages;
      combinedFormText = ""; // already in the system prompt
    }
  } catch (e: any) {
    console.error("[/api/extract_questions_chat] Failed to parse body:", e);
    return NextResponse.json(
      { error: "Bad request format", details: e.message },
      { status: 400 }
    );
  }

  try {
    // ── (F) If there's no system message yet, build it now ─────────────────
    const hasSystemAlready = messages.some((m) => m.role === "system");

    if (!hasSystemAlready) {
      const systemPrompt = `
You are an AI assistant whose job is to read a grant application form and ask exactly _one_ missing question at a time, in plain conversational English. At each turn, do the following:

1. Read the entire form content below.
2. Ask exactly one required question from the form—phrase it as a natural‐language sentence (for example, “What is your project’s start date?”).
3. Do NOT prefix with any numbering, headings, or markdown. Just ask one question, naturally.
4. If there are no further questions left, output exactly:
### NO_MORE_QUESTIONS
and nothing else.

FORM TEXT:
${combinedFormText}
`.trim();

      messages.unshift({ role: "system", content: systemPrompt });

    }

    // ── (G) Now invoke GPT‐4o in streaming mode ───────────────────────────
    const { textStream } = await streamText({
      model: openai("gpt-4o"),
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const reader = textStream.getReader();
    const streamResponse = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
          controller.close();
        } catch (e) {
          console.error("Error during streaming:", e);
          controller.error(e);
        }
      },
    });

    return new NextResponse(streamResponse, {
      headers: { "Content-Type": "text/plain; charset=UTF-8" },
    });
  } catch (err: any) {
    console.error("[/api/extract_questions_chat] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: err.message || String(err) },
      { status: 500 }
    );
  }
}
