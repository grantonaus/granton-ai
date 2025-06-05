"use server";

import { client } from "@/lib/prisma";
import { auth } from "../../../auth";

export async function isUserPremium() {
  // 1) Grab the current session (your auth() call should give you { user: { id, email, ... } } )
  const session = await auth();
  const user = session?.user;

  // 2) If there’s no logged-in user, bail early
  if (!user) {
    return { success: false, subscribed: false };
  }

  // 3) Look up that user’s record in Prisma
  const existingUser = await client.user.findUnique({
    where: { id: user.id },
    select: { hasPaid: true },
  });

  // 4) If for some reason the user isn’t in the database, treat them as “not subscribed”
  if (!existingUser) {
    return { success: false, subscribed: false };
  }

  // 5) hasPaid is already a boolean in your schema—no need to compare to a string
  const isSubscribed = existingUser.hasPaid === true;

  return {
    success: true,
    subscribed: isSubscribed,
  };
}
