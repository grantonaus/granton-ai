import { ComponentType, SVGProps } from "react";
import {
  CompanyDetailsIcon,
  PersonalDetailsIcon,
  MatchingGrantsIcon,
  GrantDatabaseIcon
} from "@/icons";

export type RecentApp = {
  id: string;
  title: string;
  fileUrl: string;
  createdAt: string;
};

type Submenu = { href: string; label: string; active: boolean };

type Menu = {
  href: string;
  label: string;
  active: boolean;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  submenus: Submenu[];
};

type Group = { groupLabel: string; menus: Menu[] };

export function getMenuList(pathname: string): Group[] {
  return [
    {
      groupLabel: "",
      menus: [
        {
          href: "/grant-database",
          label: "Grant Database",
          active: pathname.startsWith("/grant-database"),
          icon: GrantDatabaseIcon,
          submenus: []
        },
        {
          href: "/matching-grants",
          label: "Matching Grants",
          active: pathname.startsWith("/matching-grants"),
          icon: MatchingGrantsIcon,
          submenus: []
        },
        {
          href: "/personal-details",
          label: "Personal Details",
          active: pathname.startsWith("/personal-details"),
          icon: PersonalDetailsIcon,
          submenus: []
        },
        {
          href: "/company-details",
          label: "Company Details",
          active: pathname.startsWith("/company-details"),
          icon: CompanyDetailsIcon,
          submenus: []
        }
      ]
    }
  ];
}
