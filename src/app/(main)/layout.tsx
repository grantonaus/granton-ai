// "use client"

// import React from 'react';
// import { cn } from "@/lib/utils";
// import { Sidebar } from '@/components/Sidebar';
// import { PersonalProvider } from '@/contexts/PersonalContext';
// import { useSession } from 'next-auth/react';
// import { client } from '@/lib/prisma';
// import { auth } from '../../../auth';
// import { useCurrentUser } from '@/hooks/user';


// type ExploreLayoutProps = {
//   children: React.ReactNode
// }

// const ExploreLayout = ({ children }: ExploreLayoutProps) => {


//   // const { session } = useCurrentUser();

//   // console.log("Session: ", session)

//   return (
//     <>
//       <Sidebar />
//       <main
//         className={cn(
//           "h-[100dvh] bg-zinc-50 dark:bg-black transition-[margin-left] ease-in-out duration-300 lg:ml-80"
//         )}
//       >
//         {children}

//       </main>
//     </>
//   );
// }

// export default ExploreLayout

// app/(main)/ExploreLayout.tsx
import React from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/Sidebar";
import { PersonalProvider } from "@/contexts/PersonalContext";
import { client } from "@/lib/prisma";
import { auth } from "../../../auth";

type ExploreLayoutProps = {
  children: React.ReactNode;
};

export default async function ExploreLayout({ children }: ExploreLayoutProps) {
  // 1) Run on the server:
  const session = await auth();
  const userId = session?.user?.id ?? null;

  let profileComplete = false;
  if (userId) {
    const existingUser = await client.user.findUnique({
      where: { id: userId },
      select: { profileComplete: true },
    });
    profileComplete = existingUser?.profileComplete === true;
  }

  // 2) Wrap in PersonalProvider with the server‐computed flag
  return (
    <PersonalProvider initialHasPersonalDetails={profileComplete}>
      <Sidebar/>
      <main
        className={cn(
          "h-[100dvh] bg-zinc-50 dark:bg-black transition-[margin-left] ease-in-out duration-300 lg:ml-80"
        )}
      >
        {children}
      </main>
    </PersonalProvider>
  );
}
