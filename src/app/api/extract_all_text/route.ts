
// File: /app/api/extract_all_text/route.ts
import { NextResponse } from "next/server";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import pdfParse from "pdf-parse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ─── Helper: Scrape plain text from a URL ───────────────────────────────
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

// ─── Helper: Extract plain text from a PDF File ──────────────────────────
async function extractTextFromPDF(file: File): Promise<string> {
  console.log(`[extractTextFromPDF] Parsing PDF: ${file.name} (${file.size} bytes)`);
  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = await pdfParse(buffer);
  const text = parsed.text || "";
  console.log(`[extractTextFromPDF] Extracted ${text.length} chars from PDF.`);
  return text.trim();
}

export async function POST(request: Request) {
  console.log("[/api/extract_all_text] → Received request");
  try {
    const form = await request.formData();

    // ── Step 2 grant fields ─────────────────────────────────────────────
    const guidelinesFile = form.get("guidelinesFile") as File;
    const guidelinesLink = form.get("guidelinesLink")?.toString() || "";
    const applicationFormFile = form.get("applicationFormFile") as File;
    const applicationFormLink = form.get("applicationFormLink")?.toString() || "";

    // ── Step 1 company text fields ──────────────────────────────────────
    const websiteUrl = form.get("website_url") as string;
    const companyName = form.get("company_name") as string;
    const country = form.get("country") as string;
    const companyBackground = form.get("company_background") as string;
    const product = form.get("product") as string;
    const competitorsUVP = form.get("competitors_unique_value_proposition") as string;
    const currentStage = form.get("current_stage") as string;
    const mainObjective = form.get("main_objective") as string;
    const targetCustomers = form.get("target_customers") as string;
    const fundingStatus = form.get("funding_status") as string;

    // ── Step 1 attachments (possibly multiple) ───────────────────────────
    const companyAttachmentTexts: string[] = [];
    let i = 0;
    while (true) {
      const fileKey = `companyAttachmentFile_${i}`;
      const urlKey = `companyAttachmentUrl_${i}`;
      if (form.has(fileKey)) {
        const file = form.get(fileKey) as File;
        try {
          const pdfText = await extractTextFromPDF(file);
          companyAttachmentTexts.push(`COMPANY ATTACHMENT (PDF: ${file.name}):\n${pdfText}`);
        } catch (e: any) {
          console.error(`[extract_all_text] Error parsing companyAttachmentFile_${i}:`, e);
          companyAttachmentTexts.push(`COMPANY ATTACHMENT (PDF: ${file.name}) parse error: ${e.message}`);
        }
        i++;
        continue;
      } else if (form.has(urlKey)) {
        const s3url = form.get(urlKey) as string;
        try {
          const webText = await extractTextFromWeb(s3url);
          companyAttachmentTexts.push(`COMPANY ATTACHMENT (URL: ${s3url}):\n${webText}`);
        } catch (e: any) {
          console.error(`[extract_all_text] Error fetching companyAttachmentUrl_${i}:`, e);
          companyAttachmentTexts.push(`COMPANY ATTACHMENT (URL: ${s3url}) fetch error: ${e.message}`);
        }
        i++;
        continue;
      }
      break;
    }

    // ── Step 3 budget text field ────────────────────────────────────────
    const allocationDetails = form.get("allocationDetails") as string;

    // ── Now extract grant guidance text ─────────────────────────────────
    let guidelinesText = "";
    if (guidelinesFile && guidelinesFile.size > 0) {
      guidelinesText = await extractTextFromPDF(guidelinesFile);
    } else if (guidelinesLink.trim()) {
      guidelinesText = await extractTextFromWeb(guidelinesLink);
    }

    // ── Extract application form text ───────────────────────────────────
    let applicationFormText = "";
    if (applicationFormFile && applicationFormFile.size > 0) {
      applicationFormText = await extractTextFromPDF(applicationFormFile);
    } else if (applicationFormLink.trim()) {
      applicationFormText = await extractTextFromWeb(applicationFormLink);
    }

    // ── Build combined input sections ───────────────────────────────────
    const combinedSections: string[] = [];

    // 1) Company details (text)
    combinedSections.push(`---\nCOMPANY DETAILS:
- Name: ${companyName}
- Website: ${websiteUrl}
- Country: ${country}
- Background: ${companyBackground}
- Product: ${product}
- Competitors/UVP: ${competitorsUVP}
- Current Stage: ${currentStage}
- Main Objective: ${mainObjective}
- Target Customers: ${targetCustomers}
- Funding Status: ${fundingStatus}`);

    // 2) Company attachments (if any)
    if (companyAttachmentTexts.length > 0) {
      combinedSections.push(`---\nCOMPANY ATTACHMENTS:\n${companyAttachmentTexts.join("\n\n")}`);
    }

    // 3) Budget allocation details
    combinedSections.push(`---\nBUDGET DETAILS:
- Allocation Details: ${allocationDetails}`);

    // 4) Grant guidelines text
    if (guidelinesText.trim()) {
      combinedSections.push(`---\nGRANT GUIDELINES TEXT:\n${guidelinesText}`);
    }

    // 5) Application form text
    if (applicationFormText.trim()) {
      combinedSections.push(`---\nAPPLICATION FORM TEXT:\n${applicationFormText}`);
    }

    const allText = combinedSections.join("\n\n");
    console.log("[/api/extract_all_text] Combined text length:", allText.length);

    // ── Return JSON with every extracted bit ──────────────────────────────
    return NextResponse.json(
      {
        allUserEnteredText: allText,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[/api/extract_all_text] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: err.message || String(err) },
      { status: 500 }
    );
  }
}
