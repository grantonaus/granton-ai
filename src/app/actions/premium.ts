"use server";

import { auth } from "../../../auth";
import { hasActiveSubscription } from "@/lib/subscription";

/**
 * Check if the current user has an active premium subscription
 * Uses the consolidated subscription checking logic
 */
export async function isUserPremium() {
  const session = await auth();
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
