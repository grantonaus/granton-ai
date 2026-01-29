// File: /app/api/applications/route.ts

import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-server";


export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session || !session.user?.id) {
      console.error("Unauthorized: No session or user ID");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    if (!userId) {
      console.error("Session user ID is missing");
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }


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
      console.error("Error details:", err.message, err.stack);
      return NextResponse.json({ 
        error: err.message,
        details: err.stack 
      }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
}



export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { name, date, pdfUrl } = await request.json();
    if (!name || !date || !pdfUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const grant = await client.grant.create({
      data: {
        userId,
        name,
        date: new Date(date),
        pdfUrl,
      },
    });

    return NextResponse.json({ grant }, { status: 201 });
  } catch (err: unknown) {
    console.error("Error creating grant:", err);
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
}