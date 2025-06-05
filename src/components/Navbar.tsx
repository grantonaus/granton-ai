import { useSession } from "next-auth/react";
import { SheetMenu } from "./SheetMenu";
import { UserWidget } from "./UserWidget";
import { useCurrentUser } from "@/hooks/user";



interface NavbarProps {
  title: string;
}

export const Navbar = ({ title, }: NavbarProps) => {

  // const { data: session } = useSession();
  const { session } = useCurrentUser();

  console.log("session: ", session)

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
            // name={session?.user.firstName!}
            image={session?.user.image ?? ""}
          />
        </div>
      </div>
    </header>

  );
}

