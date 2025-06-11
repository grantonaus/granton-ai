import { useSession } from "next-auth/react";
import { UserWidget } from "./UserWidget";
import { useCurrentUser } from "@/hooks/user";
import SheetMenu from "./SheetMenu";



interface NavbarProps {
  title: string;
}

export const Navbar = ({ title, }: NavbarProps) => {

  const { session } = useCurrentUser();

  const fullName = session?.user.firstName
    ? session.user.firstName + (session.user.lastName ? ` ${session.user.lastName}` : "")
    : "";

  return (


    <header className="sticky top-0 z-20 w-full h-20 bg-[#0F0F0F] backdrop-blur-sm">
      <div className="px-5 max-w-[1000px] mx-auto flex pt-8 items-center">
        <div className="flex items-center space-x-4 lg:space-x-0">
          <SheetMenu />
          <div className="text-md md:text-lg font-black">{title}</div>
        </div>
        <div className="flex flex-1 items-center justify-end">
          <UserWidget
            userid={session?.user.id}
            name={fullName}
            image={session?.user.image ?? ""}
          />
        </div>
      </div>
    </header>

  );
}

