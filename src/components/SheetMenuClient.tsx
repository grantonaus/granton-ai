// app/(main)/SheetMenuClient.tsx  — **Client Component**
"use client";

import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Menu } from "./Menu";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState } from "react";

interface SheetMenuClientProps {
  profileComplete: boolean;
}

export default function SheetMenuClient({
  profileComplete,
}: SheetMenuClientProps) {
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger className="lg:hidden" asChild>
        <Button variant="outline" size="icon">
          <MenuIcon size={20} />
        </Button>
      </DrawerTrigger>

      <DrawerContent className="px-3 pb-5">
        <DrawerHeader>
          <DrawerTitle className="sr-only">Navigation Menu</DrawerTitle>
          <Link href="/home">
            <Image src="/logo.png" alt="logo" width={114} height={53} />
          </Link>
        </DrawerHeader>

        <Menu
          isOpen={true}
          personalIncomplete={!profileComplete}
          onLinkClick={() => setOpen(false)}
        />
      </DrawerContent>
    </Drawer>
  );
}
