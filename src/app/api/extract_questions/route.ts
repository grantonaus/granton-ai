import { NextResponse } from "next/server";
import { z } from "zod";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import pdfParse from "pdf-parse";
import { openai } from "@ai-sdk/openai";
import { generateObject, streamText } from "ai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const questionsSchema = z.object({
  questions: z.array(z.string().min(1)),
});

const chatContinuationSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.string().min(1),
    })
  ),
});


/**
 * Try to coerce an arbitrary string into a working absolute URL.
 * - Adds https:// or http:// if missing.
 * - Optionally probes the URL to make sure the host responds.
 *   (HEAD first, then GET fallback because some sites block HEAD.)
 *
 * @param raw       Whatever the user supplied.
 * @param probe     When true, make a network request to be extra-sure.
 * @returns         A *validated, reachable* URL string, or null if hopeless.
 */
async function fixAndValidateUrl(
  raw: string | undefined | null,
  probe = false
): Promise<string | null> {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // 🅰️  Already looks like a full URL?
  try {
    const u = new URL(trimmed);
    if (!probe) return u.href;
    if (await isReachable(u)) return u.href;
  } catch { /* fall through */ }

  // 🅱️  Missing scheme → try https:// + http://
  for (const scheme of ["https://", "http://"]) {
    try {
      const candidate = new URL(scheme + trimmed);
      if (!probe) return candidate.href;
      if (await isReachable(candidate)) return candidate.href;
    } catch {
      /* ignore, keep looping */
    }
  }

  // 🅾️  Everything failed
  return null;
}

/** Simple reachability check (HEAD, fallback to GET) */
async function isReachable(u: URL): Promise<boolean> {
  try {
    const res = await fetch(u, { method: "HEAD", redirect: "follow" });
    if (res.ok) return true;
    // Some servers reject HEAD; try GET but abort quickly (~3 s)
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), 3000);
    const resGet = await fetch(u, { method: "GET", redirect: "follow", signal: ctrl.signal });
    clearTimeout(id);
    return resGet.ok;
  } catch {
    return false;
  }
}




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
    .replace(/(\w+)-\s+(\w+)/g, "$1$2")
    .replace(/\s{2,}/g, " ")
    .replace(/[^a-zA-Z0-9.,!?\s]/g, "")
    .trim();
}


async function extractTextFromPDF(file: File): Promise<string> {
  console.log(`[extractTextFromPDF] Parsing PDF: ${file.name} (${file.size} bytes)`);
  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = await pdfParse(buffer);
  const text = parsed.text || "";
  console.log(`[extractTextFromPDF] Extracted ${text.length} chars from PDF.`);
  return text.trim();
}

async function extractTextFromPdfUrl(url: string): Promise<string> {
  console.log(`[extractTextFromPdfUrl] Fetching PDF URL: ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch PDF at ${url} (status ${res.status})`);
  }
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const { text = "" } = await pdfParse(buffer);
  console.log(`[extractTextFromPdfUrl] Extracted ${text.length} chars`);
  return text.trim();
}


function cleanExtractedText(raw: string): string {
  return raw
    .replace(/-\r?\n\s*/g, "")
    .replace(/([^\r\n])[\r\n]+(?=[^\r\n])/g, "$1 ")
    .replace(/ {2,}/g, " ")
    .replace(/(\r?\n){2,}/g, "\n\n")
    .trim();
}


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

      const companyAttachmentTexts: string[] = []
      for (let idx = 0; /* stop when no more keys */; idx++) {
        const urlKey = `companyAttachmentUrl_${idx}`
        if (!formData.has(urlKey)) break

        const s3url = formData.get(urlKey) as string
        try {
          const pdfText = await extractTextFromPdfUrl(s3url)
          const cleaned = cleanExtractedText(pdfText);
          companyAttachmentTexts.push(
            `COMPANY ATTACHMENT (PDF: ${cleaned}`
          );
        } catch (e: any) {
          console.error(`[extract_questions_chat] Error fetching ${urlKey}:`, e)
          companyAttachmentTexts.push(
            `COMPANY ATTACHMENT (URL: ${s3url}) fetch error: ${e.message}`
          )
        }
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
      // if (websiteUrl.trim()) {
      //   companyWebsiteText = await extractTextFromWeb(websiteUrl.trim());
      //   console.log(`[extract_questions_chat] Extracted ${companyWebsiteText.length} chars from company website.`);
      // }
      // if (isValidUrl(websiteUrl)) {
      //   companyWebsiteText = await extractTextFromWeb(websiteUrl);
      // } else {
      //   console.warn(`[extract_questions_chat] Skipping invalid website URL: ${websiteUrl}`);
      // }

      const fixedWebsite = await fixAndValidateUrl(websiteUrl, true);
      if (fixedWebsite) {
        companyWebsiteText = await extractTextFromWeb(fixedWebsite);
      } else if (websiteUrl.trim()) {
        console.warn(`[extract_questions_chat] Skipping invalid website URL: "${websiteUrl}"`);
      }


      // ── (B) Extract text from Grant Guidelines (PDF or link)
      let guidelinesText = "";
      if (guidelinesFile && guidelinesFile.size > 0) {
        const raw = await extractTextFromPDF(guidelinesFile);
        guidelinesText = cleanExtractedText(raw);
      } else if (guidelinesLink.trim()) {
        const raw = await extractTextFromWeb(guidelinesLink.trim());
        guidelinesText = cleanExtractedText(raw);
      }

      // ── (C) Extract text from Application Form (PDF or link)
      let applicationFormText = "";
      if (applicationFormFile && applicationFormFile.size > 0) {
        const raw = await extractTextFromPDF(applicationFormFile);
        applicationFormText = cleanExtractedText(raw);
      } else if (applicationFormLink.trim()) {
        const raw = await extractTextFromWeb(applicationFormLink.trim());
        applicationFormText = cleanExtractedText(raw);
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

      console.log("company attachments text:", companyAttachmentTexts.join("\n\n"))

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
    const systemPrompt = `
You are a grant application assistant. Your job is to generate ONLY the **essential missing questions** that the user must answer to complete their grant application.

You are given:
1. The full text of the grant application form and its required fields.
2. The answers and information the user has already provided in COMPANY DETAILS, GRANT DETAILS, and BUDGET DETAILS.
3. Any attached files or extracted content from company websites, guidelines, and application forms.

CRITICAL RULES - You MUST follow these strictly:
✅ ONLY generate questions that are EXPLICITLY required in the "APPLICATION FORM TEXT" section
✅ ONLY ask questions that are NOT already answered in the provided information (COMPANY DETAILS, GRANT DETAILS, BUDGET DETAILS)
✅ ONLY include questions that require a meaningful written response (text-based, not checkboxes, files, or administrative fields)

❌ DO NOT ask about anything that is already provided in:
  - Company name, background, product, stage, objective, customers, funding status
  - Grant link, amount applying for
  - Budget allocation details
  - Any information clearly stated in COMPANY DETAILS, GRANT DETAILS, or BUDGET DETAILS

❌ DO NOT ask for administrative or manual fields:
  - Email addresses, phone numbers, contact information
  - Signatures, dates, registration numbers
  - File uploads, attachments
  - Personal bios, team member details
  - Tax IDs, registration numbers
  - Checkboxes, dropdowns, or multiple choice questions

❌ DO NOT ask about topics already covered:
  - Project description, product overview
  - Problem being solved, market opportunity
  - Company background, target customers
  - Unique value proposition, solution details
  - Current product stage, funding status
  - Budget allocation (already provided)

✅ ONLY ask about questions that are:
  - Explicitly required in the APPLICATION FORM TEXT
  - Not already answered in the provided information
  - Require a written response (not administrative fields)
  - Truly missing from the application

Examples of what to ask (ONLY if required in form and not already answered):
- Timeline or milestones (if not in provided info)
- Long-term vision (if not in provided info)
- Go-to-market plan (if not in provided info)
- Risks & challenges (if not in provided info)
- Metrics for success (if not in provided info)
- Revenue model details (if not in provided info)
- Partnerships (if not in provided info)

IMPORTANT: If all required questions are already answered, return an empty array: {"questions": []}

Return your result in this format:

{
  "questions": [
    "What is your project timeline?",
    "What are your key milestones for the next 12 months?",
    ...
  ]
}

FORM TEXT:
${combinedFormText}
`.trim();


    const { object } = await generateObject({
      model: openai('o3-mini'),
      schema: questionsSchema,
      prompt: systemPrompt,
      temperature: 0
    });

    // 5) Validate the returned object
    const safe = questionsSchema.safeParse(object);
    if (!safe.success) {
      console.error("Invalid output from GPT:", object);
      return NextResponse.json(
        { error: "Failed to generate questions" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      combinedFormText,
      questions: safe.data.questions
    }, { status: 200 });
  } catch (err: any) {
    console.error("[/api/extract_questions_chat] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: err.message || String(err) },
      { status: 500 }
    );
  }
}
