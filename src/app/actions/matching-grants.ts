"use server";

import { auth } from "../../../auth";
import { client } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import OpenAI from "openai";
import { hasActiveSubscription } from "@/lib/subscription";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

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

export type MatchedGrant = {
  id: string;
  title: string;
  agency: string;
  shortDescription: string;
  state: string;
  status: string;
  deadline: string;
  grantUrl?: string | null;
  remainingDays?: number | null;
  longTitle?: string | null;
  matchScore: number;
  matchQuality?: string;
  matchQualityColor?: string;
  matchReasons: string[];
};

export interface MatchingGrantsData {
  grants: MatchedGrant[];
  message?: string;
  error?: string;
}

export async function getMatchingGrants(): Promise<MatchingGrantsData> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { grants: [], error: "Not authenticated" };
    }

    const userId = session.user.id;

    // Check subscription
    const hasActive = await hasActiveSubscription(userId);
    if (!hasActive) {
      return {
        grants: [],
        error: "Subscription required",
        message: "You need an active subscription to view matching grants. Please upgrade to Pro to access AI-powered grant matching.",
      };
    }

    const dbUser = await client.user.findUnique({
      where: { id: userId },
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
      return { grants: [], error: "User not found" };
    }

    if (!dbUser.companyName || !dbUser.companyBackground) {
      return {
        grants: [],
        error: "Company profile incomplete",
        message: "Please complete your company profile.",
      };
    }

    // Build embedding
    const profileText = buildCompanyProfile(dbUser);

    const embeddingRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: profileText,
    });

    const companyEmbedding = embeddingRes.data[0].embedding;

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
      return {
        grants: [],
        error: "Match function failed",
      };
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
    const topMatches = (matches || []).slice(0, Math.max(MIN_MATCHES_REQUIRED, matches?.length || 0));

    // Remap scores: 0.25-0.85 similarity → 60-100 display
    // Lower scores (0.25-0.50) map to 60-75%, good matches (0.50-0.70) show 75-90%, excellent (0.70+) show 90-100%
    const remapScore = (sim: number) => {
      const normalized = Math.max(0, Math.min(1, (sim - MIN_THRESHOLD) / (MAX_SIMILARITY - MIN_THRESHOLD)));
      return Math.round(60 + normalized * 40); // 60-100 range
    };

    // Map to frontend format
    const formatted: MatchedGrant[] = topMatches.map((g: any) => ({
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
      matchReasons: ["AI semantic match"],
    }));

    return { grants: formatted };
  } catch (error: any) {
    console.error("Error fetching matching grants:", error);
    return {
      grants: [],
      error: "Internal error",
    };
  }
}

