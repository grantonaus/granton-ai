// app/api/recent-apps/route.ts
import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/prisma";
import { auth } from "../../../../auth";

interface RecentAppResponse {
  id: string;
  title: string;
  fileUrl: string;
  createdAt: string; 
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const grants = await client.grant.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 3,
      select: {
        id: true,
        name: true,
        pdfUrl: true,
        date: true,
      },
    });

    const responsePayload: RecentAppResponse[] = grants.map((g) => ({
      id: g.id,
      title: g.name,
      fileUrl: g.pdfUrl,
      createdAt: g.date.toISOString(), 
    }));

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (err) {
    console.error("Error in GET /api/recent-apps:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
