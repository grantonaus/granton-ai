// app/(main)/Sidebar.tsx
import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Menu } from "./Menu";
import { client } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-server";
import { hasActiveSubscription } from "@/lib/subscription";

export async function Sidebar() {
  const session = await getServerSession();
  const userId = session?.user?.id ?? null;

  // let profileComplete = false;
  // if (userId) {
  //   try {
  //     const existingUser = await client.user.findUnique({
  //       where: { id: userId },
  //       select: { profileComplete: true },
  //     });
  //     profileComplete = existingUser?.profileComplete === true;
  //   } catch (e) {
  //     console.error("Could not query Prisma for profileComplete:", e);
  //     profileComplete = false;
  //   }
  // }

  let profileComplete = session?.user.profileComplete === true;
  let companyComplete = session?.user.companyComplete === true;
  const isSubscribed = userId ? await hasActiveSubscription(userId) : false;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-[100dvh] w-80 shrink-0 -translate-x-full border-white/[0.06] bg-[#121212] transition-transform duration-300 ease-in-out lg:translate-x-0"
      )}
      style={{ resize: "none" }}
    >
      <div
        className="relative flex h-full min-h-0 flex-col overflow-y-auto px-7 pb-4 pt-8"
        style={{ resize: "none" }}
      >
        <Button
          className={cn(
            "flex flex-row items-center transition-transform ease-in-out duration-300 mb-1 justify-start translate-x-0"
          )}
          variant="link"
          asChild
        >
          <Link href="/grant-database" className="flex items-center gap-2">
            <Image src="/1.png" alt="logo" width={130} height={64} />
          </Link>
        </Button>

        <Menu
          isOpen={true}
          companyIncomplete={!companyComplete}
          personalIncomplete={!profileComplete}
          isSubscribed={isSubscribed}
        />
      </div>
    </aside>
  );
}
