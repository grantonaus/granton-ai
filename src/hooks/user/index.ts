// import { auth } from "../../../../auth";



// export const useCurrentUser = async () => {
//   const session = await auth();

//   // return session?.user;
//   return session;
// };

"use client"

import { useCallback, useEffect, useState } from "react";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";
import { usePathname } from "next/navigation";

export const useCurrentUser = () => {

  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<string>("unauthenticated");
  const pathName = usePathname();

  const retrieveSession = useCallback(async () => {
    try {
      setStatus("loading");
      const sessionData = await getSession();

      if (sessionData) {
        setSession(sessionData);
        setStatus("authenticated");
        return;
      }

      setStatus("unauthenticated");
    } catch {
      setStatus("unauthenticated");
      setSession(null);
    }
  }, []);

  useEffect(() => {
    retrieveSession();

  }, [retrieveSession, pathName]);

  return { session, status };
};
