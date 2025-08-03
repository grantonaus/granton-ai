// app/(main)/Sidebar.tsx
import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Menu } from "./Menu";
import { client } from "@/lib/prisma";
import { auth } from "../../auth";

export async function Sidebar() {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  let isPremium = session?.user?.hasPaid === true;

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

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-40 h-screen bg-[#121212] -translate-x-full lg:translate-x-0 transition-[width] ease-in-out duration-300 w-80"
      )}
    >
      <div className="relative h-full flex flex-col px-7 pt-8 pb-4 overflow-y-auto">
        <Button
          className={cn(
            "flex flex-row items-center transition-transform ease-in-out duration-300 mb-1 justify-start translate-x-0"
          )}
          variant="link"
          asChild
        >
          <Link href="/new-application" className="flex items-center gap-2">
            <Image src="/1.png" alt="logo" width={114} height={53} />
          </Link>
        </Button>

        <Menu
          isOpen={true}
          companyIncomplete={!companyComplete}
          personalIncomplete={!profileComplete}
          isPremium={isPremium}
        />
      </div>
    </aside>
  );
}
