// app/api/profile-data/route.ts
import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/prisma";
import { auth } from "../../../../auth";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    // 1) Verify session (App Router version of next-auth)
    const session = await auth();

    const user = session?.user;

    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId: string = user.id;

    // 2) Fetch only the personal fields we need from Prisma
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
        profileComplete: true,
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
      profileComplete: userRecord.profileComplete,
    });
  } catch (err) {
    console.error("Error in GET /api/profile-data:", err);
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
      // 2) Check authentication via NextAuth (server action style)
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }
      const userId = session.user.id;
  
      // 3) Parse & validate the JSON body
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
  
      // 4) Persist into Prisma
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
          // If you have a `profileComplete` boolean, set it here:
          // profileComplete: true,
        },
      });
  
      return NextResponse.json({ success: true });
    } catch (err) {
      console.error("Error in /api/personal:", err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }