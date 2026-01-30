"use server";


import { redirect } from "next/navigation";
import { client } from "@/lib/prisma";
import { PersonalSchema, PersonalDetailsData } from "@/components/form/personal-schema";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getServerSession } from "@/lib/auth-server";
import { createSession } from "@/lib/auth-custom";


export async function savePersonalDetails(formData: FormData) {

    const session = await getServerSession();

  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const userId = session.user.id;

  const raw: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    raw[key] = typeof value === "string" ? value : "";
  }

  const parseResult = PersonalSchema.safeParse(raw);
  if (!parseResult.success) {
    const errors = parseResult.error.flatten().fieldErrors;
    throw new Error("Validation failed: " + JSON.stringify(errors));
  }

  const data = parseResult.data as PersonalDetailsData;

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

  await createSession(userId);
  revalidatePath("/", "layout");

  redirect("/personal-details");
}
