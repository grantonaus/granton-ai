import { z } from "zod";

// Supabase parsed_grants table structure
export const SupabaseGrantSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  "Short Title": z.string().nullable().optional(),
  "Long Title": z.string().nullable().optional(),
  "Description": z.string().nullable().optional(),
  "State": z.string().nullable().optional(),
  "Current Status": z.string().nullable().optional(),
  "Status List": z.string().nullable().optional(),
  "Deadline": z.string().nullable().optional(),
  "Closedate": z.string().nullable().optional(),
  "Grant URL": z.string().url().nullable().optional(),
  "Remaining Days": z.union([z.string(), z.number()]).nullable().optional(),
}).passthrough(); // Allow additional fields

export type SupabaseGrant = z.infer<typeof SupabaseGrantSchema>;

// Company data from Prisma User model (matching the select fields)
export type CompanyData = {
  companyName: string | null;
  websiteUrl: string | null;
  country: string | null;
  companyBackground: string | null;
  product: string | null;
  competitorsUniqueValueProposition: string | null;
  currentStage: string | null;
  mainObjective: string | null;
  targetCustomers: string | null;
  fundingStatus: string | null;
};

// Company data for filtering (subset)
export type CompanyFilterData = {
  country?: string | null;
  state?: string | null;
  product?: string | null;
  companyBackground?: string | null;
};

// Normalized grant status
export type GrantStatus = "Open" | "Ongoing" | "Closed" | "Unknown";

// Matched grant response type
export type MatchedGrant = {
  id: string;
  title: string;
  agency: string;
  shortDescription: string;
  state: string;
  status: GrantStatus;
  deadline: string;
  grantUrl: string | null;
  remainingDays: number | string | null;
  longTitle: string | null;
  matchScore: number;
  matchReasons: string[];
};

// OpenAI Embedding API Response
export type OpenAIEmbeddingResponse = {
  object: string;
  data: Array<{
    object: string;
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
};

// Match API Response
export type MatchGrantsResponse = {
  grants: MatchedGrant[];
  totalFiltered?: number;
  totalScored?: number;
  message?: string;
  error?: string;
  details?: string;
};


