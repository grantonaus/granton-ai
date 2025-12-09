"use server";

import { auth } from "../../../auth";
import { client } from "@/lib/prisma";
import type { PersonalDetailsData } from "@/components/PersonalDetails";

export async function getPersonalDetails(): Promise<PersonalDetailsData | null> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return null;
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
      return null;
    }

    return {
      primary_first_name: userRecord.firstName ?? "",
      primary_last_name: userRecord.lastName ?? "",
      contact_salutation: userRecord.contactSalutation ?? "",
      contact_job_title: userRecord.contactJobTitle ?? "",
      contact_first_name:
        userRecord.contactFirstName || userRecord.firstName || "",
      contact_last_name: userRecord.contactLastName || userRecord.lastName || "",
      contact_email: userRecord.contactEmail ?? "",
      contact_mobile: userRecord.contactMobile ?? "",
    };
  } catch (error) {
    console.error("Error fetching personal details:", error);
    return null;
  }
}

