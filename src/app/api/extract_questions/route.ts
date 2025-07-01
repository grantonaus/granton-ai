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
      if (websiteUrl.trim()) {
        companyWebsiteText = await extractTextFromWeb(websiteUrl.trim());
        console.log(`[extract_questions_chat] Extracted ${companyWebsiteText.length} chars from company website.`);
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
You are a grant application assistant. Your job is to generate only the **essential missing questions** that the user must answer to complete their grant application.

You are given:
1. The full text of the grant application form and its required fields.
2. The answers and information the user has already provided.
3. Any attached files or extracted content from company websites, guidelines, and application forms.

Your task is to:
✅ Identify any **required questions or fields** that are **not yet answered**  
❌ Do NOT repeat questions that are already answered in full  
❌ Do NOT ask about project descriptions, background, problem/solution, sector, or status if these are clearly provided  
❌ Do NOT ask for administrative or manual fields like:
  - Email addresses
  - Phone numbers
  - Signatures
  - Registration/tax numbers
  - File uploads
  - Personal bios
✅ Only include **questions that require a meaningful written response** (text-based, not checkboxes or files)

You must:
- Return each question as a short, natural, one-sentence prompt
- Keep the tone conversational and professional
- Skip all duplicates and overexplained fields

Use this list to filter out redundant questions:
> Do NOT ask about:
- Project description
- Product overview
- Problem being solved
- Market opportunity
- Sector or track
- Company background
- Target customers
- Unique value proposition
- Solution or how the product works
- Current product stage or funding status

Only ask what’s truly missing, such as:
- Timeline
- Key milestones
- Long-term vision
- Go-to-market plan
- Risks & challenges
- Metrics for success
- User acquisition & retention
- Revenue model
- Partnerships
- Any questions required in the grant form but not yet covered

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
