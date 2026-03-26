import React from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/Sidebar";
import { PersonalProvider } from "@/contexts/PersonalContext";
import { client } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-server";
import { DynamicNavbar } from "@/components/DynamicNavbar";
import { SubscriptionStatusRefresher } from "@/components/SubscriptionStatusRefresher";

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
      <SubscriptionStatusRefresher />
      <Sidebar />
      <main
        className={cn(
          "flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-[#0F0F0F]",
          "transition-[margin-left] duration-300 ease-in-out lg:ml-80 lg:border-l lg:border-white/[0.06]"
        )}
        style={{ resize: "none" }}
      >
        <DynamicNavbar />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </main>
    </PersonalProvider>
  );
}
