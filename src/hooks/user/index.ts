"use client"

import { useSession } from "@/lib/auth-client-custom";
import { usePathname } from "next/navigation";

export const useCurrentUser = () => {
  const pathName = usePathname();
  const { data: session, isPending } = useSession();

  return { 
    session: session ? {
      user: session.user,
      expires: session.expiresAt || "",
    } : null, 
    status: isPending ? "loading" : (session ? "authenticated" : "unauthenticated")
  };
};
