// import { NextResponse } from "next/server";
// import { getServerSession } from "@/lib/auth-server";
// import { supabase } from "@/lib/supabase";

// export async function GET() {
//   try {
//     const session = await getServerSession();
//     const user = session?.user;

//     if (!user) {
//       return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
//     }

//     const userId = user.id;

//     // ---- Fetch grants ----
//     const { data: grants, error: grantsErr } = await supabase
//       .from("parsed_grants")
//       .select("*")
//       .order("updated_at", { ascending: false });

//     if (grantsErr) throw grantsErr;

//     // ---- Fetch saved grants for this user ----
//     const { data: saved, error: savedErr } = await supabase
//       .from("user_saved_grants")
//       .select("grant_id")
//       .eq("user_id", userId);

//     if (savedErr) throw savedErr;

//     const savedIds = new Set(saved.map((s) => s.grant_id));

//     // ---- Fetch seen grants ----
//     const { data: seen, error: seenErr } = await supabase
//       .from("user_grant_seen")
//       .select("grant_id")
//       .eq("user_id", userId);

//     if (seenErr) throw seenErr;

//     const seenIds = new Set(seen.map((s) => s.grant_id));

//     // ---- Transform grants with metadata ----
//     const parsed = (grants || []).map((g) => {
//       let status = g.status || "Unknown";
//       const s = status.toLowerCase();

//       if (s.includes("open") || s.includes("available")) status = "Open";
//       else if (s.includes("ongoing") || s.includes("rolling")) status = "Ongoing";
//       else if (s.includes("closed")) status = "Closed";

//       let deadline = g.deadline;
//       if (deadline) {
//         const d = new Date(deadline);
//         if (!isNaN(d.getTime())) {
//           deadline = d.toLocaleDateString("en-AU", {
//             day: "numeric",
//             month: "short",
//             year: "numeric",
//           });
//         }
//       }

//       return {
//         id: g.id,
//         title: g.short_title || g.long_title,
//         shortDescription: g.description,
//         agency: g.state,
//         status,
//         state: g.state,
//         deadline,
//         grantUrl: g.url,
//         isSaved: savedIds.has(g.id),
//         isSeen: seenIds.has(g.id),
//         _updated_at: g.updated_at, // Internal field for sorting
//       };
//     });

//     // ---- Sort: unseen grants first, then by updated_at descending ----
//     parsed.sort((a, b) => {
//       // First, sort by seen status (unseen first)
//       if (a.isSeen !== b.isSeen) {
//         return a.isSeen ? 1 : -1;
//       }
//       // Then sort by updated_at descending
//       const aDate = a._updated_at ? new Date(a._updated_at).getTime() : 0;
//       const bDate = b._updated_at ? new Date(b._updated_at).getTime() : 0;
//       return bDate - aDate;
//     });

//     // Remove internal sorting field from response
//     const finalParsed = parsed.map(({ _updated_at, ...rest }) => rest);

//     return NextResponse.json({
//       grants: finalParsed,
//       subscribed: true,
//       savedGrants: finalParsed.filter((g) => g.isSaved),
//       seenGrantIds: [...seenIds],
//     });
//   } catch (err) {
//     console.error(err);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }


import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.id;

    // -----------------------------------------
    // 1. Fetch all grants
    // -----------------------------------------
    const { data: grants, error: grantsErr } = await supabase
      .from("parsed_grants")
      .select("*")
      .order("updated_at", { ascending: false });

    if (grantsErr) throw grantsErr;

    // -----------------------------------------
    // 2. Fetch saved grants for user
    // -----------------------------------------
    const { data: saved, error: savedErr } = await supabase
      .from("user_saved_grants")
      .select("grant_id")
      .eq("user_id", userId);

    if (savedErr) throw savedErr;

    const savedIds = new Set(saved.map((s) => s.grant_id));

    // -----------------------------------------
    // 3. Transform grants
    // -----------------------------------------
    const parsed = (grants || []).map((g) => {
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

        // keep saved + new flags
        isSaved: savedIds.has(g.id),
        isNew: !!g.is_new,

        // internal sorting
        _updated_at: g.updated_at,
      };
    });

    // -----------------------------------------
    // 4. SORTING:
    //    Show new grants first
    // -----------------------------------------
    parsed.sort((a, b) => {
      if (a.isNew !== b.isNew) return a.isNew ? -1 : 1; // new → top
      const at = a._updated_at ? new Date(a._updated_at).getTime() : 0;
      const bt = b._updated_at ? new Date(b._updated_at).getTime() : 0;
      return bt - at;
    });

    // Remove internal field
    const finalParsed = parsed.map(({ _updated_at, ...rest }) => rest);

    // Count new grants for badge
    const newCount = parsed.filter((g) => g.isNew).length;

    return NextResponse.json({
      grants: finalParsed,
      subscribed: true,
      savedGrantIds: [...savedIds],
      newCount, // <— useful for UI badge
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}