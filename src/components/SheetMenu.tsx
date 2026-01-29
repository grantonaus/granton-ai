import SheetMenuClient from "./SheetMenuClient";
// Client component - uses useCurrentUser hook
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
