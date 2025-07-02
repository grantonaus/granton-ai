
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import pdfParse from 'pdf-parse';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';



export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const guidelinesLink = formData.get('guidelinesLink')?.toString() || '';
    const applicationFormLink = formData.get('applicationFormLink')?.toString() || '';
    const guidelinesFile = formData.get('guidelinesFile');
    const applicationFormFile = formData.get('applicationFormFile');




    const extractTextFromWeb = async (url: string): Promise<string> => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch ${url} (status ${res.status})`);

      const html = await res.text();
      const $ = cheerio.load(html);

      const text = $('article').text() || $('body').text();

      return text
        .replace(/(\w+)-\s+(\w+)/g, '$1$2')
        .replace(/\s{2,}/g, ' ')
        .replace(/[^a-zA-Z0-9.,!?\s]/g, '')
        .trim();
    };


    let guidelinesTextFile = '';
    let applicationTextFile = '';
    let guidelinesTextLink = '';
    let applicationTextLink = '';


    // Extract from guidelines file
    if (guidelinesFile instanceof File) {
      const buffer = Buffer.from(await guidelinesFile.arrayBuffer());
      const parsed = await pdfParse(buffer);
      guidelinesTextFile = parsed.text || '';
    }

    // Extract from application form file
    if (applicationFormFile instanceof File) {
      const buffer = Buffer.from(await applicationFormFile.arrayBuffer());
      const parsed = await pdfParse(buffer);
      applicationTextFile = parsed.text || '';
    }

    // Extract from guidelines link
    if (typeof guidelinesLink === 'string' && guidelinesLink.trim()) {
      guidelinesTextLink = await extractTextFromWeb(guidelinesLink);
    }

    if (applicationFormFile instanceof File) {
      // applicationFormText = await extractTextFromPDF(applicationFormFile);
    } else if (applicationFormLink) {
      applicationTextLink = await extractTextFromWeb(applicationFormLink);
    }

    const results: Record<string, string> = {};

    if (guidelinesLink.trim()) {
      try {
        results.guidelinesText = await extractTextFromWeb(guidelinesLink);
      } catch (err: any) {
        // results.guidelinesError = err.message;
        console.warn(`[guidelinesLink] Skipped due to error: ${err.message}`);
      }
    }

    if (typeof applicationFormLink === 'string' && applicationFormLink.trim()) {
      try {
        results.applicationFormText = await extractTextFromWeb(applicationFormLink);
      } catch (err: any) {
        // results.applicationFormError = err.message;
        console.warn(`[applicationFormLink] Skipped due to error: ${err.message}`);
      }
    }

    const combinedInputSections = [];
    if (guidelinesTextFile.trim()) {
      combinedInputSections.push(`---\nGUIDELINES (file):\n${guidelinesTextFile.trim()}`);
    }
    if (guidelinesTextLink.trim()) {
      combinedInputSections.push(`---\nGUIDELINES (link):\n${guidelinesTextLink.trim()}`);
    }
    if (applicationTextFile.trim()) {
      combinedInputSections.push(`---\nAPPLICATION FORM (file):\n${applicationTextFile.trim()}`);
    }
    if (applicationTextLink.trim()) {
      combinedInputSections.push(`---\nAPPLICATION FORM (link):\n${applicationTextLink.trim()}`);
    }

    const aiInput = combinedInputSections.join('\n\n');

    // System prompt for extracting Eligible Expenses & Matched Funding
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

    // Call Vercel AI SDK
    const aiResponse = await generateText({
      // model: openai('o1-mini'),
      model: openai('gpt-4.1-nano'),
      prompt: systemPrompt,
    });

    const aiResult = aiResponse?.text?.trim() || '';

    // Return JSON with both raw extracts and AI result
    return NextResponse.json(
      {
        // guidelinesTextFromFile: guidelinesTextFile.trim(),
        // applicationFormTextFromFile: applicationTextFile.trim(),
        // guidelinesTextFromLink: guidelinesTextLink.trim(),
        // applicationFormTextFromLink: applicationTextLink.trim(),
        aiGrantExtraction: aiResult,
      },
      { status: 200 }
    );

    // return NextResponse.json({
    //   guidelinesTextFromFile: guidelinesTextFile.trim(),
    //   applicationFormTextFromFile: applicationTextFile.trim(),
    //   guidelinesTextFromLink: guidelinesTextLink.trim(),
    //   applicationFormTextFromLink: applicationTextLink.trim(),
    // });
  } catch (err: any) {
    console.error("Unexpected error in URL parsing API:", err);
    return NextResponse.json(
      { error: 'Internal Server Error', details: err.message || String(err) },
      { status: 500 }
    );
  }
}
