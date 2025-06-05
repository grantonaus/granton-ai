import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Menu } from "./Menu";
import { usePersonal } from "@/contexts/PersonalContext";

export function Sidebar() {

  const { hasPersonalDetails } = usePersonal();


  return (
    <aside
      className={cn(
        // "fixed top-0 left-0 z-40 h-screen -translate-x-full lg:translate-x-0 transition-[width] ease-in-out duration-300 bg-[#fafafa] dark:bg-[#090909]",
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
          <Link href="/home" className="flex items-center gap-2">
            {/* <div className="rounded-sm bg-gray-white border dark:bg-black w-6 h-6 mr-1" /> */}
            {/* <div className="rounded-sm bg-[#6127FF] flex items-center justify-center size-7 mr-1">
              <div className="size-4 rounded-full bg-white dark:bg-black"/>
            </div> */}
            <Image
              src="/logo.png"
              alt='logo'
              width={114}
              height={53}
            />
          </Link>
        </Button>
        <Menu isOpen={true} personalIncomplete={!hasPersonalDetails} />
      </div>
    </aside>
  );
}