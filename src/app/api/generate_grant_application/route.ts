import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({
  combinedText: z.string().min(1),
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.string(),
    })
  ),
});

export async function POST(request: NextRequest) {
  // parse & validate
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Bad Request", details: parsed.error.format() },
      { status: 400 }
    );
  }
  const { combinedText, messages } = parsed.data;

  // 2) extract title
  let title = "Untitled Grant";
  try {
    const titleRes = await generateText({
      // model: openai("o1-mini"),
      model: openai('gpt-4.1-nano'),
      temperature: 0,
      messages: [{
        role: "user",
        //         content: `
        // Extract ONLY the official grant name (exactly as it appears, no extra words):

        // ${combinedText}
        //         `.trim()

        content: `
Extract ONLY the official name of the grant or funding program mentioned in the text below.

⚠️ VERY IMPORTANT RULES:
- Return ONLY the exact name of the grant program, exactly as written in the text.
- Do NOT include quotes, punctuation, or extra words.
- Do NOT include explanations, summaries, or any text before or after the name.
- If no grant name is found, return: "Unknown Grant"

🧠 Examples:

Text: "We’re applying to the 2023 OpenAI Research Grant."
Output: 2023 OpenAI Research Grant

Text: "Our proposal is for the Binance Labs Incubation Program."
Output: Binance Labs Incubation Program

Text: "This application supports HelpKit's use case."
Output: HelpKit

Text: "We’re just exploring ideas."
Output: Unknown Grant

---

Now extract the grant name from this text:
---
${combinedText}
---
`.trim()

      }]
    });
    const firstLine = titleRes.text.split("\n")[0].trim();
    if (firstLine) title = firstLine;
  } catch (err) {
    console.error("Title extraction failed:", err);
  }

  // 3) your system prompt
  const systemPrompt = `
You are a grant application writing assistant designed to help prepare clear, compelling, and tailored responses to common grant application questions using information provided by the user.

Use natural, professional English. Your task is to generate clear, persuasive, and tailored content for a grant application based on the client's responses to the following fields. Use concise, professional language. Write in the third person. Prioritise innovation, commercial potential, and public impact (such as job creation, economic contribution, or export readiness).

`.trim();

  // 4) generate the application
  let bodyText: string;
  try {
    const appRes = await generateText({
      model: openai("o3-mini"),
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
        // { role: "user", content: combinedText },
        {
          role: "user",
          content: `

        
        The following text contains:
        - Company information (under "COMPANY DETAILS")
        - Grant information (under "GRANT DETAILS")
        - Budget plans (under "BUDGET DETAILS")
        - Optional attachments and website text
        - The full grant application form (under "APPLICATION FORM TEXT")
        - And optionally, grant guidelines for tone and alignment
        
        Your task:
        1. Extract the individual questions or sections from the "APPLICATION FORM TEXT".
        2. For each question, locate the most relevant information in the other sections.
        3. Write a complete and professional answer for each question, using formal third-person business English.
        4. Format the output like this:
           1. [Application form question]
              [your detailed answer]
           2. [Next question]
              ...
           3. ...
        
        Guidelines:
        - Answers can be short or long depending on what fits.
        - If any question cannot be answered based on the available content, write: "Answer not provided."
        - Maintain professional tone, clarity, and structure.
        - Do not include any explanation, JSON, or metadata in your output.
        - Only return the final, clean application with all questions and answers.
        
        Here is the full text to work with:
        ---
        ${combinedText}
        ---
        `.trim()
        },
//         {
//           role: "user", content: `
// Now generate a complete, structured grant application:
// • Professional third-person English
// • Sections: Executive Summary; Project Description; Budget Justification; Impact; Conclusion
// • Emphasise innovation, commercial potential, public impact
// Return ONLY the application text—no JSON or metadata.
//         `.trim()
//         }
      ],
    });
    bodyText = appRes.text.trim();
  } catch (err: any) {
    console.error("Application generation failed:", err);
    return NextResponse.json({ error: "Generation failed", details: err.message }, { status: 502 });
  }

  // 5) return title + text
  return NextResponse.json({ title, text: bodyText }, { status: 200 });
}
