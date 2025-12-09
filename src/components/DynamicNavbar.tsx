"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";

// Map routes to page titles
const routeTitles: Record<string, string> = {
  "/new-application": "New Application",
  "/past-applications": "Past Applications",
  "/company-details": "Company Details",
  "/personal-details": "Personal Details",
  "/matching-grants": "Matching Grants",
  "/grant-database": "Grant Database",
};

export function DynamicNavbar() {
  const pathname = usePathname();
  const title = routeTitles[pathname] || "Granton AI";

  return <Navbar title={title} />;
}

