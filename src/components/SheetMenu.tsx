import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTrigger } from "@/components/ui/drawer";
import { Menu } from "./Menu";
import { Button } from "./ui/button";
import Image from "next/image";

export function SheetMenu() {
  return (
    // <Sheet>
    //   <SheetTrigger className="lg:hidden" asChild>
    //     <Button className="h-8" variant="outline" size="icon">
    //       <MenuIcon size={20} />
    //     </Button>
    //   </SheetTrigger>
    //   <SheetContent className="sm:w-64 px-3 h-full flex flex-col z-50" side="left">
    //     <SheetHeader>
    //       <Button
    //         className="flex justify-center items-center pb-2 pt-1"
    //         variant="link"
    //         asChild
    //       >
    //     <Link href="/dashboard" className="flex items-start gap-2">
    //       <SheetTitle className="font-bold text-lg">SaaS</SheetTitle>
    //     </Link>
    //   </Button>
    // </SheetHeader>
    // <Menu isOpen />
    //   </SheetContent>
    // </Sheet>


    <Drawer>
      <DrawerTrigger className="lg:hidden" asChild>
        <Button className="size-9" variant="outline" size="icon">
          <MenuIcon size={20} />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="px-3 pb-5">
        <DrawerHeader>
          <Link href={""}>
            <Image
              src="/logo.png"
              alt='logo'
              width={114}
              height={53}
            />
          </Link>
        </DrawerHeader>

        <Menu isOpen />
      </DrawerContent>
    </Drawer>
  );
}
