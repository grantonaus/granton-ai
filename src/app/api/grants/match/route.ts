import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { client } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Build company text for embedding
function buildCompanyProfile(u: any): string {
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

export async function GET() {
  console.log("[MATCH API] Request started");

  try {
    // ------------------------------
    // 1. Auth
    // ------------------------------
    const session = await auth();
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

    // Only show real matches - filter out weak ones
    const MIN_THRESHOLD = 0.50; // Minimum similarity to show (filters out 45% matches)
    const MAX_SIMILARITY = 0.85; // Expected max similarity for excellent matches

    const { data: matches, error: rpcError } = await supabase.rpc(
      "match_grants",
      {
        query_embedding: companyEmbedding,
        match_threshold: MIN_THRESHOLD, // Higher threshold for real matches only
        match_count: 200, // Show all matches above threshold
      }
    );

    if (rpcError) {
      console.error("[MATCH API ERROR] RPC failed:", rpcError);
      return NextResponse.json(
        { error: "Match function failed", details: rpcError },
        { status: 500 }
      );
    }

    console.log("[MATCH API] RPC returned:", matches?.length || 0);

    // Remap scores: 0.50-0.85 similarity → 75-100 display
    // This ensures all matches show at least 75%, good matches (0.65) show ~85%, excellent show 95-100%
    const remapScore = (sim: number) => {
      const normalized = Math.max(0, Math.min(1, (sim - MIN_THRESHOLD) / (MAX_SIMILARITY - MIN_THRESHOLD)));
      return Math.round(75 + normalized * 25); // 75-100 range
    };

    // ------------------------------
    // 5. Map to frontend format
    // ------------------------------
    const formatted = (matches || []).map((g: any, index: number) => ({
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