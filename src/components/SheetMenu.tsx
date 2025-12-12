import SheetMenuClient from "./SheetMenuClient";
import { auth } from "../../auth";
import { useCurrentUser } from "@/hooks/user";

export default function SheetMenu() {

  const { session } = useCurrentUser()
  const profileComplete = session?.user?.profileComplete ?? false;

  return (
    <SheetMenuClient
      profileComplete={profileComplete}
    />
  );
}
