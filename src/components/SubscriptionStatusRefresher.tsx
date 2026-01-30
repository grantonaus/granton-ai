"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const REFRESH_INTERVAL_MS = 60 * 1000; // 60 seconds

/**
 * Periodically refreshes the layout so server components (e.g. Sidebar)
 * re-fetch subscription status from the DB. Ensures subscription changes
 * (e.g. from Stripe webhook or another tab) appear within ~1 minute
 * without a full page reload.
 */
export function SubscriptionStatusRefresher() {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      router.refresh();
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [router]);

  return null;
}
