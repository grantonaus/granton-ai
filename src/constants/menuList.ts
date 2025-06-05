// // constants/menuList.ts
// import { ComponentType, SVGProps } from "react";
// import {
//   NewApplicationIcon,
//   CompanyDetailsIcon,
//   PastApplicationsIcon,
//   PersonalDetailsIcon
// } from "@/icons";
// import {
//   Bookmark,
//   GalleryVertical
// } from "lucide-react";

// type Submenu = { href: string; label: string; active: boolean };

// type Menu = {
//   href: string;
//   label: string;
//   active: boolean;
//   // <-- allow any React SVG component:
//   icon: ComponentType<SVGProps<SVGSVGElement>>;
//   submenus: Submenu[];
// };

// type Group = { groupLabel: string; menus: Menu[] };

// export function getMenuList(pathname: string): Group[] {
//   return [
//     {
//       groupLabel: "",
//       menus: [
//         {
//           href: "/new-application",
//           label: "New Application",
//           active: pathname.startsWith("/new-application"),
//           icon: NewApplicationIcon,
//           submenus: []
//         },
//         {
//           href: "/company-details",
//           label: "Company Details",
//           active: pathname.startsWith("/company-details"),
//           icon: CompanyDetailsIcon,
//           submenus: []
//         },
//         {
//           href: "/personal-details",
//           label: "Personal Details",
//           active: pathname.startsWith("/personal-details"),
//           icon: PersonalDetailsIcon,
//           submenus: []
//         },
//         // {
//         //   href: "/past-applications",
//         //   label: "Past Applications",
//         //   active: pathname.startsWith("/past-applications"),
//         //   icon: PastApplicationsIcon,
//         //   submenus: [
//         //     { href: "/posts", label: "All Posts", active: pathname === "/posts" },
//         //     { href: "/posts/new", label: "New Post", active: pathname === "/posts/new" }
//         //   ]
//         // }
//         {
//           href: "/past-applications",
//           label: "Past Applications",
//           active: pathname.startsWith("/past-applications"),
//           icon: PastApplicationsIcon,
//           submenus: [
//             { href: "/downloads/app1.pdf", label: "Application Mar 2025", active: false },
//             { href: "/downloads/app2.pdf", label: "Application Feb 2025", active: false },
//             { href: "/downloads/app3.pdf", label: "Application Jan 2025", active: false }
//           ]
//         }
//       ]
//     }
//   ];
// }



// constants/menuList.ts
import { ComponentType, SVGProps } from "react";
import {
  NewApplicationIcon,
  CompanyDetailsIcon,
  PastApplicationsIcon,
  PersonalDetailsIcon
} from "@/icons";
import { Bookmark, GalleryVertical } from "lucide-react";

/**
 * We define a “RecentApp” type here that matches what our API returns:
 *   { id, title, fileUrl, createdAt }
 */
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

/**
 * Now we accept `recentApps` as a second argument.
 * We’ll only show up to three of them in the “Past Applications” submenu.
 */
export function getMenuList(
  pathname: string,
  recentApps: RecentApp[] = []
): Group[] {
  // Take at most the first 3 applications
  const topThree = recentApps.slice(0, 3);

  // Map each RecentApp → a submenu link. We pass `active: false`
  // because these are just download links, not “active route” links.
  const pastAppSubmenus: Submenu[] = topThree.map((app) => ({
    href: app.fileUrl,
    label: app.title, // you could also do `${app.title} (${app.createdAt})` if you want the date in the label
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
