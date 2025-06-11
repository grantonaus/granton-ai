"use server";

import { client } from "@/lib/prisma";
import { auth } from "../../../auth";

export async function isProfileComplete() {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    return { success: false, isProfileComplete: false };
  }

  const existingUser = await client.user.findUnique({
    where: { id: user.id },
    select: { profileComplete: true }, // ✅ include this field
  });

  if (!existingUser) {
    return { success: false, isProfileComplete: false };
  }

  return {
    success: true,
    isProfileComplete: existingUser.profileComplete === true,
  };
}
