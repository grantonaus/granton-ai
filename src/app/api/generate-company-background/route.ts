import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as cheerio from "cheerio";
import fetch from "node-fetch";

const RequestSchema = z.object({
  company_name: z.string().optional(),
  website_url: z.string().optional(),
  country: z.string().optional(),
  product: z.string().optional(),
  competitors_unique_value_proposition: z.string().optional(),
  current_stage: z.string().optional(),
  main_objective: z.string().optional(),
  target_customers: z.string().optional(),
  funding_status: z.string().optional(),
});

// Helper function to extract text from website
async function extractTextFromWeb(url: string): Promise<string> {
  try {
    // Ensure URL has protocol
    const fullUrl = url.startsWith("http") ? url : `https://${url}`;
    
    console.log("Fetching website content from:", fullUrl);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(fullUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; GrantOn/1.0; +https://granton.io)",
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.log("Failed to fetch website, status:", response.status);
      return "";
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Remove script and style tags
    $("script, style").remove();
    
    // Extract text from article or body
    let text = $("article").text() || $("body").text();
    
    // Clean up the text
    text = text
      .replace(/(\w+)-\s+(\w+)/g, "$1$2")
      .replace(/\s{2,}/g, " ")
      .trim();
    
    // Take first 2000 characters to avoid token limits
    const cleanedText = text.substring(0, 2000);
    
    console.log("Website content extracted, length:", cleanedText.length);
    return cleanedText;
  } catch (error) {
    console.error("Error fetching website content:", error);
    return "";
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Fetch website content if URL is provided
    let websiteContent = "";
    if (data.website_url && data.website_url.trim()) {
      websiteContent = await extractTextFromWeb(data.website_url);
    }

    // Build company details
    const companyDetails: string[] = [];
    if (data.company_name) companyDetails.push(`Company Name: ${data.company_name || "Not provided"}`);
    if (data.country) companyDetails.push(`Location: ${data.country || "Not provided"}`);
    if (data.product) companyDetails.push(`Product/Service: ${data.product || "Not provided"}`);
    if (data.competitors_unique_value_proposition) {
      companyDetails.push(`Unique Value Proposition: ${data.competitors_unique_value_proposition}`);
    }
    if (data.current_stage) companyDetails.push(`Current Stage: ${data.current_stage}`);
    if (data.main_objective) companyDetails.push(`Main Objective: ${data.main_objective}`);
    if (data.target_customers) companyDetails.push(`Target Customers: ${data.target_customers}`);
    if (data.funding_status) companyDetails.push(`Funding Status: ${data.funding_status}`);

    if (companyDetails.length === 0 && !websiteContent) {
      return NextResponse.json(
        { error: "Please fill in at least one field or provide a website URL to generate company background" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a professional business analyst who excels at understanding companies from their website content and creating accurate, concise descriptions.`;

    // Build prompt based on whether we have website content
    const userPrompt = websiteContent
      ? `Based on the website content below, generate a professional company background description:

WEBSITE CONTENT:

${websiteContent}

COMPANY DETAILS:

${companyDetails.join("\n")}

Please create a background description in this format:

[Brief description of their main product/service/technology]

[Who they serve - specific industries, business types, or customer segments]

[Key challenges or pain points they address for their customers]

Requirements:
- Be factual and based on the website content
- Keep each section to 1-2 sentences
- Use professional language
- Focus on what makes them unique
- Include relevant industry terms for grant matching
- Do not include section titles or markdown formatting`
      : `Generate a professional company background description for the following business:

${companyDetails.join("\n")}

Please create a background description in this format:

[Brief description of their main product/service/technology]

[Who they likely serve based on the provided information]

[Common challenges they likely address]

Requirements:
- Make reasonable assumptions based on the provided information
- Keep each section to 1-2 sentences
- Use professional language
- Include relevant industry terms for grant matching
- Do not include section titles or markdown formatting`;

    const result = await generateText({
      model: openai("o3-mini"),
      temperature: 0.3,
      maxTokens: 500,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const generatedText = result.text?.trim() || "";
    
    if (!generatedText) {
      console.error("AI generation returned empty result");
      return NextResponse.json(
        { error: "Failed to generate company background. The AI returned an empty response. Please try again or provide more information." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { company_background: generatedText },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error generating company background:", err);
    return NextResponse.json(
      { error: "Failed to generate company background", details: err.message },
      { status: 500 }
    );
  }
}

