import { NextResponse } from "next/server";
import { client } from "@/lib/prisma";
import { auth } from "../../../../auth";

export async function GET() {
  const session = await auth();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const dbUser = await client.user.findUnique({
    where: { id: user.id },
    select: { hasPaid: true, companyName: true },
  });

  if (!dbUser || !dbUser.hasPaid) {
    // return NextResponse.json({ error: "Not subscribed" }, { status: 403 });
    return NextResponse.json({ error: "Not subscribed" }, { status: 403 });
  }

  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY!;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID!;
  const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID!;

  const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`;

  const response = await fetch(airtableUrl, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Airtable error:", errorText);
    return NextResponse.json({ error: errorText }, { status: 500 });
  }

  const data = await response.json();

  const dbCompanyName = dbUser.companyName?.toLowerCase().trim();

  const matchingGrants = data.records
    .filter((record: any) => {
      const airtableCompany = record.fields["Company Name"]?.toLowerCase().trim();
      return airtableCompany === dbCompanyName;
    })
    .map((record: any) => ({
      id: record.id,
      name: record.fields["Short Title"] || "Untitled Grant",
      company: record.fields["Company Name"] || "",
      pdfUrl: record.fields["URL"] || undefined,
      description: record.fields["Description"] || "",
    }));

  return NextResponse.json(matchingGrants);
}

