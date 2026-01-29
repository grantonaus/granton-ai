"use server";

import { getServerSession } from "@/lib/auth-server";
import { client } from "@/lib/prisma";

export interface PastApplication {
  id: string;
  title: string;
  fileUrl: string;
  createdAt: string;
}

export async function getPastApplications(): Promise<PastApplication[]> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return [];
    }

    const userId = session.user.id;

    const grants = await client.grant.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });

    return grants.map((g) => {
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
  } catch (error) {
    console.error("Error fetching past applications:", error);
    return [];
  }
}

