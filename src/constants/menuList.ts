import { ComponentType, SVGProps } from "react";
import {
  NewApplicationIcon,
  CompanyDetailsIcon,
  PastApplicationsIcon,
  PersonalDetailsIcon
} from "@/icons";
import { Bookmark, GalleryVertical } from "lucide-react";

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

export function getMenuList(
  pathname: string,
  recentApps: RecentApp[] = []
): Group[] {
  const topThree = recentApps.slice(0, 3);

  const pastAppSubmenus: Submenu[] = topThree.map((app) => ({
    href: app.fileUrl,
    label: app.title, 
    active: false
  }));

  return [
    {
      groupLabel: "",
      menus: [
        {
          href: "/new-application",
          label: "New Application",
          active: pathname.startsWith("/new-application"),
          icon: NewApplicationIcon,
          submenus: []
        },
        {
          href: "/company-details",
          label: "Company Details",
          active: pathname.startsWith("/company-details"),
          icon: CompanyDetailsIcon,
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
          href: "/past-applications",
          label: "Past Applications",
          active: pathname.startsWith("/past-applications"),
          icon: PastApplicationsIcon,
          submenus: pastAppSubmenus
        }
      ]
    }
  ];
}
