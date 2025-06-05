import { useMemo } from "react";

export const useInitials = (name: string) => {
  const initials = useMemo(() => {
    if (!name) return "";

    const nameParts = name.split(" ");
    return nameParts
      .map(part => part.charAt(0).toUpperCase())
      .join("");
  }, [name]);

  return initials;
};