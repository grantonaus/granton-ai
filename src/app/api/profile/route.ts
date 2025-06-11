// app/api/profile-data/route.ts
import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/prisma";
import { auth } from "../../../../auth";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const session = await auth(); // NextAuth’s server helper
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const userRecord = await client.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        contactSalutation: true,
        contactJobTitle: true,
        contactFirstName: true,
        contactLastName: true,
        contactEmail: true,
        contactMobile: true,
      },
    });
    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({
      primary_first_name: userRecord.firstName,
      primary_last_name: userRecord.lastName,
      email: userRecord.email,
      contact_salutation: userRecord.contactSalutation,
      contact_job_title: userRecord.contactJobTitle,
      contact_first_name: userRecord.contactFirstName,
      contact_last_name: userRecord.contactLastName,
      contact_email: userRecord.contactEmail,
      contact_mobile: userRecord.contactMobile,
    });
  } catch (err) {
    console.error("Error in GET /api/profile:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}



const PersonalSchema = z.object({
  primary_first_name: z.string().min(1),
  primary_last_name: z.string().min(1),
  contact_salutation: z.string().min(1),
  contact_job_title: z.string().min(1),
  contact_first_name: z.string().min(1),
  contact_last_name: z.string().min(1),
  contact_email: z.string().email(),
  contact_mobile: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();
    const parseResult = PersonalSchema.safeParse(body);
    if (!parseResult.success) {
      const fieldErrors = parseResult.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: "Validation failed", details: fieldErrors },
        { status: 400 }
      );
    }
    const data = parseResult.data;

    await client.user.update({
      where: { id: userId },
      data: {
        firstName: data.primary_first_name,
        lastName: data.primary_last_name,
        contactSalutation: data.contact_salutation,
        contactJobTitle: data.contact_job_title,
        contactFirstName: data.contact_first_name,
        contactLastName: data.contact_last_name,
        contactEmail: data.contact_email,
        contactMobile: data.contact_mobile,
        profileComplete: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in POST /api/profile-data:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}