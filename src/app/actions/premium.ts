"use server";

import { getServerSession } from "@/lib/auth-server";
import { hasActiveSubscription } from "@/lib/subscription";

export async function isUserPremium() {
  const session = await getServerSession();
  const user = session?.user;

  if (!user?.id) {
    return { success: false, subscribed: false };
  }

  const subscribed = await hasActiveSubscription(user.id);

  return {
    success: true,
    subscribed,
  };
}







