import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import { client } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Build company text for embedding
function buildCompanyProfile(u: any): string {
  // Build a comprehensive profile that accurately describes the company
  return [
    u.companyName && `Company: ${u.companyName}`,
    u.companyBackground && `Background: ${u.companyBackground}`,
    u.product && `Product: ${u.product}`,
    u.competitorsUniqueValueProposition &&
    `USP: ${u.competitorsUniqueValueProposition}`,
    u.currentStage && `Stage: ${u.currentStage}`,
    u.mainObjective && `Objective: ${u.mainObjective}`,
    u.targetCustomers && `Customers: ${u.targetCustomers}`,
    u.fundingStatus && `Funding: ${u.fundingStatus}`,
    u.country && `Location: ${u.country}`,
  ]
    .filter(Boolean)
    .join(". ");
}

/**
 * Uses AI to check if a grant has hard eligibility requirements that exclude the user
 * Returns true if the grant should be EXCLUDED (incompatible), false if compatible
 */
async function checkGrantEligibility(
  grant: { description?: string; short_title?: string; long_title?: string },
  userProfile: string
): Promise<boolean> {
  try {
    const grantText = [
      grant.short_title,
      grant.long_title,
      grant.description,
    ]
      .filter(Boolean)
      .join(" ");

    if (!grantText.trim()) {
      return false; // If no grant text, don't exclude
    }

    const prompt = `You are a grant eligibility checker. Your job is to determine if a grant has HARD eligibility requirements that would EXCLUDE a specific company profile.

HARD requirements are mandatory criteria that cannot be waived. These include:

1. GENDER/DEMOGRAPHIC REQUIREMENTS:
   - "female founders only", "women-led businesses", "women entrepreneurs"
   - "male founders only", "men-led businesses" (rare but possible)
   - "indigenous businesses only", "First Nations businesses"
   - "youth-led only", "under 30 founders only"
   - "LGBTQ+ owned businesses only"
   - Any other demographic-specific requirement

2. INDUSTRY/DOMAIN REQUIREMENTS:
   - "green energy only", "renewable energy", "sustainability", "clean tech"
   - "agriculture only", "farming", "agri-tech"
   - "healthcare only", "medical", "biotech", "pharmaceutical"
   - "education only", "edtech", "learning platforms"
   - "web3 only", "blockchain", "cryptocurrency", "NFT", "DeFi"
   - "manufacturing only", "industrial", "production"
   - "retail only", "e-commerce", "consumer products"
   - "SaaS only", "software", "tech startups"
   - "fintech only", "financial services"
   - "food & beverage only", "F&B", "restaurant"
   - "real estate only", "property", "construction"
   - "transportation only", "logistics", "mobility"
   - Any other specific industry requirement

3. GEOGRAPHIC REQUIREMENTS:
   - "Australia only", "specific state only" (if company is in different location)
   - "rural only", "regional only" (if company is urban)
   - "urban only" (if company is rural)

4. STAGE/STATUS REQUIREMENTS:
   - "pre-seed only", "seed only", "Series A only"
   - "non-profit only", "for-profit only"
   - "B2B only", "B2C only"

CRITICAL RULES:
- Only exclude if there is a CLEAR, MANDATORY requirement that DIRECTLY CONFLICTS with the company profile
- If the grant mentions something as a preference, example, or "priority given to", but doesn't make it mandatory, do NOT exclude
- If the grant says "open to all industries" or "all sectors welcome", do NOT exclude based on industry
- If the company profile doesn't clearly indicate gender, industry, or other characteristics, do NOT exclude (be conservative)
- When in doubt, do NOT exclude - it's better to show a potentially relevant grant than to hide a good match

Company Profile:
${userProfile}

Grant Information:
Title: ${grant.short_title || grant.long_title || "N/A"}
Description: ${grant.description || "N/A"}

Analyze the grant description carefully. Look for words like "only", "must be", "required", "eligible only if", "exclusively for", "restricted to" which indicate hard requirements.

Respond with ONLY a JSON object in this exact format:
{
  "exclude": true or false,
  "reason": "brief explanation if exclude is true, empty string if false"
}

Examples:
- Grant says "female founders only" and company profile indicates male founder → exclude: true
- Grant says "green energy startups only" and company is web3/blockchain → exclude: true
- Grant says "priority given to green energy" but doesn't restrict other industries → exclude: false
- Grant says "open to all tech startups" and company is web3 → exclude: false`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a precise grant eligibility checker. Only exclude grants with clear, mandatory requirements that conflict with the company profile.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1, // Low temperature for consistent, precise results
    });

    const responseText = completion.choices[0]?.message?.content || "{}";
    const result = JSON.parse(responseText);

    if (result.exclude === true) {
      console.log(
        `[ELIGIBILITY] Excluding grant "${grant.short_title || grant.long_title}": ${result.reason || "Hard requirement mismatch"}`
      );
      return true; // Exclude this grant
    }

    return false; // Grant is compatible
  } catch (error) {
    console.error("[ELIGIBILITY] Error checking grant eligibility:", error);
    // On error, don't exclude (be permissive to avoid false positives)
    return false;
  }
}

export async function GET() {
  console.log("[MATCH API] Request started");

  try {
    // ------------------------------
    // 1. Auth
    // ------------------------------
    const session = await getServerSession();
    const user = session?.user;

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log("[MATCH API] Auth OK:", user.id);

    // ------------------------------
    // 2. Fetch user + company data
    // ------------------------------
    const dbUser = await client.user.findUnique({
      where: { id: user.id },
      select: {
        companyName: true,
        companyBackground: true,
        product: true,
        competitorsUniqueValueProposition: true,
        currentStage: true,
        mainObjective: true,
        targetCustomers: true,
        fundingStatus: true,
        country: true,
        state: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!dbUser.companyName || !dbUser.companyBackground) {
      return NextResponse.json(
        {
          error: "Company profile incomplete",
          message: "Please complete your company profile.",
        },
        { status: 400 }
      );
    }

    console.log("[MATCH API] User data OK");

    // ------------------------------
    // 3. Build embedding
    // ------------------------------
    const profileText = buildCompanyProfile(dbUser);

    console.log("[MATCH API] Creating embedding…");

    const embeddingRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: profileText,
    });

    const companyEmbedding = embeddingRes.data[0].embedding;

    console.log("[MATCH API] Embedding generated:", {
      dimensions: companyEmbedding.length,
    });

    // ------------------------------
    // 4. Call Supabase RPC
    // ------------------------------
    console.log("[MATCH API] Calling RPC: match_grants");

    // Always show at least 10 best matches, even with lower scores
    const MIN_THRESHOLD = 0.25; // Lower threshold to get more matches
    const MAX_SIMILARITY = 0.85; // Expected max similarity for excellent matches
    const MIN_MATCHES_REQUIRED = 10; // Always return at least 10 matches

    // Call Supabase RPC with lower threshold to get more results
    let { data: matches, error: rpcError } = await supabase.rpc(
      "match_grants",
      {
        query_embedding: companyEmbedding,
        match_threshold: MIN_THRESHOLD, // Lower threshold to ensure we get enough matches
        match_count: Math.max(MIN_MATCHES_REQUIRED * 2, 50), // Request more to ensure we have enough
      }
    );

    if (rpcError) {
      console.error("[MATCH API ERROR] RPC failed:", rpcError);
      return NextResponse.json(
        { error: "Match function failed", details: rpcError },
        { status: 500 }
      );
    }

    // If we have fewer than required matches, try with even lower threshold
    if (!matches || matches.length < MIN_MATCHES_REQUIRED) {
      const { data: moreMatches } = await supabase.rpc("match_grants", {
        query_embedding: companyEmbedding,
        match_threshold: 0.20, // Even lower threshold
        match_count: MIN_MATCHES_REQUIRED * 2,
      });
      if (moreMatches && moreMatches.length > (matches?.length || 0)) {
        matches = moreMatches;
      }
    }

    // Take top matches (sorted by similarity descending from RPC)
    // Get more candidates to filter from
    let candidateMatches = (matches || []).slice(
      0,
      Math.max(MIN_MATCHES_REQUIRED * 3, 100)
    );

    // If user has a selected state, only keep grants for that state or National
    const userState = dbUser.state?.trim();
    if (userState) {
      const normalizedUserState = userState.toLowerCase();
      candidateMatches = candidateMatches.filter((g: any) => {
        const grantState = (g.state ?? "").toString().trim().toLowerCase();
        if (!grantState) return false;
        if (grantState === "national") return true;
        return grantState === normalizedUserState;
      });
    }

    console.log(
      "[MATCH API] Checking eligibility for",
      candidateMatches.length,
      "candidate matches"
    );

    // Filter out grants with incompatible hard requirements
    const eligibleMatches = [];
    
    for (const match of candidateMatches) {
      const shouldExclude = await checkGrantEligibility(
        {
          description: match.description,
          short_title: match.short_title,
          long_title: match.long_title,
        },
        profileText
      );
      
      if (!shouldExclude) {
        eligibleMatches.push(match);
      }
      
      // Stop once we have enough eligible matches
      if (eligibleMatches.length >= MIN_MATCHES_REQUIRED * 2) {
        break;
      }
    }

    // Take top eligible matches
    const topMatches = eligibleMatches.slice(0, Math.max(MIN_MATCHES_REQUIRED, eligibleMatches.length));

    console.log("[MATCH API] After eligibility filtering:", topMatches.length, "eligible matches");

    // Remap scores: 0.25-0.85 similarity → 60-100 display
    // Lower scores (0.25-0.50) map to 60-75%, good matches (0.50-0.70) show 75-90%, excellent (0.70+) show 90-100%
    const remapScore = (sim: number) => {
      const normalized = Math.max(0, Math.min(1, (sim - MIN_THRESHOLD) / (MAX_SIMILARITY - MIN_THRESHOLD)));
      return Math.round(60 + normalized * 40); // 60-100 range
    };

    // ------------------------------
    // 5. Map to frontend format
    // ------------------------------
    const formatted = topMatches.map((g: any, index: number) => ({
      id: g.id,
      title: g.short_title || g.long_title || "Untitled Grant",
      agency: g.state || "Unknown",
      shortDescription: g.description || "",
      state: g.state || "National",
      status: g.status || "Unknown",
      deadline: g.deadline || "—",
      grantUrl: g.url,
      longTitle: g.long_title,
      matchScore: remapScore(g.similarity),
      matchReasons: ["AI semantic match"], // you can enrich later
    }));

    return NextResponse.json({
      grants: formatted,
    });
  } catch (err: any) {
    console.error("[MATCH API] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal error", details: err.message },
      { status: 500 }
    );
  }
}