"use server";

import { getServerSession } from "@/lib/auth-server";
import { supabase } from "@/lib/supabase";

export type Grant = {
  id: string;
  title: string;
  shortDescription: string;
  agency: string;
  state: string;
  status: string;
  deadline: string;
  grantUrl: string | null;
  isNew: boolean;
  isSaved: boolean;
};

export interface GrantDatabaseData {
  grants: Grant[];
  savedGrantIds: string[];
  newCount: number;
}

export async function getGrantDatabase(): Promise<GrantDatabaseData> {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return { grants: [], savedGrantIds: [], newCount: 0 };
    }

    const userId = session.user.id;

    // Fetch all grants
    const { data: grants, error: grantsErr } = await supabase
      .from("parsed_grants")
      .select("*")
      .order("updated_at", { ascending: false });

    if (grantsErr) throw grantsErr;

    // Fetch saved grants for user
    const { data: saved, error: savedErr } = await supabase
      .from("user_saved_grants")
      .select("grant_id")
      .eq("user_id", userId);

    if (savedErr) throw savedErr;

    const savedIds = new Set(saved.map((s) => s.grant_id));

    // Transform grants
    const parsed = (grants || []).map((g: any) => {
      // Normalize status
      let status = g.status || "Unknown";
      const s = status.toLowerCase();

      if (s.includes("open") || s.includes("available")) status = "Open";
      else if (s.includes("ongoing") || s.includes("rolling")) status = "Ongoing";
      else if (s.includes("closed")) status = "Closed";

      // Format deadline
      let deadline = g.deadline;
      if (deadline) {
        const d = new Date(deadline);
        if (!isNaN(d.getTime())) {
          deadline = d.toLocaleDateString("en-AU", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
        }
      }

      return {
        id: g.id,
        title: g.short_title || g.long_title,
        shortDescription: g.description ?? "",
        agency: g.state,
        status,
        state: g.state,
        deadline,
        grantUrl: g.url ?? null,
        isSaved: savedIds.has(g.id),
        isNew: !!g.is_new,
        _updated_at: g.updated_at,
      };
    });

    // Sort: new grants first
    parsed.sort((a, b) => {
      if (a.isNew !== b.isNew) return a.isNew ? -1 : 1;
      const at = a._updated_at ? new Date(a._updated_at).getTime() : 0;
      const bt = b._updated_at ? new Date(b._updated_at).getTime() : 0;
      return bt - at;
    });

    // Remove internal field
    const finalParsed = parsed.map(({ _updated_at, ...rest }) => rest);

    // Count new grants
    const newCount = parsed.filter((g) => g.isNew).length;

    return {
      grants: finalParsed,
      savedGrantIds: Array.from(savedIds),
      newCount,
    };
  } catch (error) {
    console.error("Error fetching grant database:", error);
    return { grants: [], savedGrantIds: [], newCount: 0 };
  }
}

