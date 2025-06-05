// File: /app/api/applications/route.ts

import { NextResponse } from "next/server";
import { client } from "@/lib/prisma";      // Adjust the import path if your prisma client lives elsewhere           // Same auth helper you used in decks example
import { auth } from "../../../../auth";


export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;


    const grants = await client.grant.findMany({
      where: { userId },
      orderBy: { date: "desc" }, 
    });


    const applications = grants.map((g) => {
      const d = new Date(g.date);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      const formattedDate = `${day}.${month}.${year}`;

      return {
        id: g.id,
        title: g.name,       
        fileUrl: g.pdfUrl,    
        createdAt: formattedDate,
      };
    });

    return NextResponse.json({ applications }, { status: 200 });
  } catch (err: unknown) {
    console.error("Error fetching applications:", err);
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
}
