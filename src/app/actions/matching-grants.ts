"use server";

import { auth } from "../../../auth";
import { client } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { hasActiveSubscription } from "@/lib/subscription";
import OpenAI from "openai";

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
    if (!session?.user) {
      return { grants: [], error: "Not authenticated" };
    }

    // Check if user has active subscription
    const hasActive = await hasActiveSubscription(session.user.id);
    if (!hasActive) {
      return {
        grants: [],
        error: "Subscription required",
        message: "You need an active subscription to view matching grants. Please upgrade to Pro to access AI-powered grant matching.",
      };
    }

    const dbUser = await client.user.findUnique({
      where: { id: session.user.id },
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

    // Call Supabase RPC
    const { data: matches, error: rpcError } = await supabase.rpc(
      "match_grants",
      {
        query_embedding: companyEmbedding,
        match_threshold: 0.2,
        match_count: 20,
      }
    );

    if (rpcError) {
      console.error("[MATCH API ERROR] RPC failed:", rpcError);
      return {
        grants: [],
        error: "Match function failed",
      };
    }

    // Map to frontend format
    const formatted: MatchedGrant[] = (matches || []).map((g: any) => ({
      id: g.id,
      title: g.short_title || g.long_title || "Untitled Grant",
      agency: g.state || "Unknown",
      shortDescription: g.description || "",
      state: g.state || "National",
      status: g.status || "Unknown",
      deadline: g.deadline || "—",
      grantUrl: g.url,
      longTitle: g.long_title,
      matchScore: Math.round(g.similarity * 100),
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

