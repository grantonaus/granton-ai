"use server";

import { deleteSession } from "@/lib/auth-custom";
import { redirect } from "next/navigation";

export const logout = async () => {
  await deleteSession();
  redirect("/login");
};
