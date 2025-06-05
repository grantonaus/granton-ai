"use client"

import React from 'react';
import { cn } from "@/lib/utils";
import { Sidebar } from '@/components/Sidebar';
import { PersonalProvider } from '@/contexts/PersonalContext';
import { useSession } from 'next-auth/react';
import { client } from '@/lib/prisma';
import { auth } from '../../../auth';
import { useCurrentUser } from '@/hooks/user';


type ExploreLayoutProps = {
  children: React.ReactNode
}

const ExploreLayout = ({ children }: ExploreLayoutProps) => {


  const { session } = useCurrentUser();

  return (
    <PersonalProvider initialHasPersonalDetails={session?.user.profileComplete!}>
      <Sidebar />
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

export default ExploreLayout