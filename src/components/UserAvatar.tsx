// components/UserAvatar.tsx
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { logout } from "@/app/actions/logout";
import { useRouter } from "next/navigation";
import { useInitials } from "@/hooks/useInitials";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { DropDown } from "./ui/drop-down";

type UserWidgetProps = {
  image?: string; // make image optional
  name: string;
  userid?: string;
};

export const UserAvatar = ({ image, name }: UserWidgetProps) => {
  const initials = useInitials(name);
  const router = useRouter();

  console.log("initials: ", initials)

  const onLogout = async () => {
    try {
      await logout();
      router.replace("/sign-in");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <DropDown
      title="Account"
      trigger={
        <Avatar className="cursor-pointer">
          {image ? (
            <AvatarImage src={image} alt={name} />
          ) : (
            <AvatarFallback>{initials}</AvatarFallback>
          )}
        </Avatar>
      }
    >
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            className="р-9 flex gap-x-2.5 px-2 justify-start w-full mt-2 py-0 cursor-pointer"
          >
            <LogOut size={20} />
            Logout
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="my-0">Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription className="my-0">
              Are you sure you want to log out? This will end your session and
              redirect you to the login page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-10 hover:bg-[#131313] hover:text-white/80 cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onLogout}
              className="h-10 bg-destructive hover:bg-destructive/80 text-white cursor-pointer"
            >
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DropDown>
  );
};
