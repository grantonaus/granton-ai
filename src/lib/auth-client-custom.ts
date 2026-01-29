"use client";

import { useEffect, useState } from "react";
import type { SessionUser } from "./auth-custom";

interface Session {
  user: SessionUser;
  expiresAt?: string;
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      try {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const data = await response.json();
          setSession(data);
        } else {
          setSession(null);
        }
      } catch (error) {
        console.error("Failed to fetch session:", error);
        setSession(null);
      } finally {
        setIsPending(false);
      }
    }

    fetchSession();
  }, []);

  return { data: session, isPending };
}

export async function signOut() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/login";
}
