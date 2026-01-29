import React from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/Sidebar";
import { PersonalProvider } from "@/contexts/PersonalContext";
import { client } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-server";
import { DynamicNavbar } from "@/components/DynamicNavbar";

export const dynamic = 'force-dynamic';

type ExploreLayoutProps = {
  children: React.ReactNode;
};

export default async function ExploreLayout({ children }: ExploreLayoutProps) {
  // 1) Run on the server:
  const session = await getServerSession();
  const userId = session?.user?.id ?? null;

  let profileComplete = false;
  let companyComplete = false;
  if (userId) {
    const existingUser = await client.user.findUnique({
      where: { id: userId },
      select: { profileComplete: true, companyComplete: true },
    });
    profileComplete = existingUser?.profileComplete === true;
    companyComplete = existingUser?.companyComplete === true;
  }

  // 2) Wrap in PersonalProvider with the server‐computed flag
  return (
    <PersonalProvider initialHasPersonalDetails={profileComplete} initialHasCompanyDetails={companyComplete}>
      <Sidebar/>
      <main
        className={cn(
          "h-[100dvh] bg-zinc-50 dark:bg-black transition-[margin-left] ease-in-out duration-300 lg:ml-80 flex flex-col"
        )}
        style={{ resize: 'none' }}
      >
        <DynamicNavbar />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </PersonalProvider>
  );
}
