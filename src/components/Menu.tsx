"use client";

import Link from "next/link";
import { Ellipsis, LogOut, Plus, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import React from 'react';
import { CollapseMenuButton } from "./CollapsMenuButton";
import { getMenuList, RecentApp } from "@/constants/menuList";
import { ExpandableLinkMenu } from "./ExpandableLinkMenu";
import { getStripe } from "@/lib/stripeClient";
import { useCurrentUser } from "@/hooks/user";

interface MenuProps {
  isOpen: boolean | undefined;
  personalIncomplete?: boolean;
}

export function Menu({ isOpen }: MenuProps) {
  const pathname = usePathname();
  const { personalIncomplete } = (arguments[0] as MenuProps);
  // const menuList = getMenuList(pathname);


  const sampleApps: RecentApp[] = [
    {
      id: "1",
      title: "Emerging Technologies Innovation Grant",
      fileUrl: "/downloads/emerging-tech.pdf",
      createdAt: "14.03.2025",
    },
    {
      id: "2",
      title: "SME Growth Accelerator Fund",
      fileUrl: "/downloads/sme-growth.pdf",
      createdAt: "13.03.2025",
    },
    {
      id: "3",
      title: "Global Market Expansion Grant Program",
      fileUrl: "/downloads/global-expansion.pdf",
      createdAt: "12.03.2025",
    },
  ];



  const [loading, setLoading] = useState(false);

  const [recentApps, setRecentApps] = useState<RecentApp[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);

  // useEffect(() => {
  //   async function loadLastThree() {
  //     try {
  //       const res = await fetch("/api/applications");
  //       const json = await res.json();
  //       if (res.ok && Array.isArray(json.applications)) {
  //         setRecentApps(json.applications.slice(0, 3));
  //       } else {
  //         console.error("Failed to fetch applications:", json.error);
  //       }
  //     } catch (err) {
  //       console.error("Error fetching applications:", err);
  //     } finally {
  //       setLoadingApps(false);
  //     }
  //   }
  //   loadLastThree();
  // }, []);

  useEffect(() => {
    // Simulate a short “loading” delay, then set the sampleApps:
    const timer = setTimeout(() => {
      setRecentApps(sampleApps);
      setLoadingApps(false);
    }, 500); // 500ms delay just so you see the “Loading…” text briefly

    return () => clearTimeout(timer);
  }, []);

  const menuList = getMenuList(pathname, recentApps);


  const isUpgraded = false;


  const handleUpgrade = async () => {
    setLoading(true);

    try {
      // 1) Call our server route to create a checkout session
      const resp = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await resp.json();
      if (!resp.ok) {
        console.error("Failed to create checkout session:", data);
        alert(data.error || "Unable to start checkout.");
        setLoading(false);
        return;
      }

      const { sessionId } = data;
      if (!sessionId) {
        console.error("No sessionId in response:", data);
        alert("Something went wrong (no session ID).");
        setLoading(false);
        return;
      }

      // 2) Load Stripe.js and redirect to Checkout
      const stripe = await getStripe();
      if (!stripe) {
        alert("Stripe.js failed to load.");
        setLoading(false);
        return;
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        console.error("Stripe redirect error:", error);
        alert(error.message);
      }
    } catch (err) {
      console.error("Error in handleUpgrade:", err);
      alert("An unexpected error occurred. Try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      {/* <ScrollArea className="overflow-visible [&>div>div]:overflow-visible"> */}
      <nav className="md:mt-7 h-full w-full overflow-visible [&>div>div]:overflow-visible">
        <ul className="flex flex-col min-h-[calc(100vh-48px-36px-16px-60px)] lg:min-h-[calc(100vh-32px-40px-60px)] items-start space-y-1 px-2 overflow-visible [&>div>div]:overflow-visible">
          {menuList.map(({ groupLabel, menus }, index) => (
            <li className={cn("w-full", groupLabel ? "pt-5" : "")} key={index}>
              {(isOpen && groupLabel) || isOpen === undefined ? (
                <p className="text-sm font-medium text-muted-foreground px-4 pb-2 max-w-[248px] truncate">
                  {groupLabel}
                </p>
              ) : !isOpen && isOpen !== undefined && groupLabel ? (
                <TooltipProvider>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger className="w-full">
                      <div className="w-full flex justify-center items-center">
                        <Ellipsis className="h-5 w-5 flex-shrink-0" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{groupLabel}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <p className="pb-2"></p>
              )}
              {menus.map(
                ({ href, label, icon: Icon, active, submenus }, index) =>
                  submenus.length === 0 ? (
                    <div className="w-full" key={index}>
                      <TooltipProvider disableHoverableContent>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <Button
                              variant={active ? "secondary" : "ghost"}
                              className="relative w-full justify-start font-medium text-[15px] h-12 mb-1 py-0 rounded-md"
                              asChild
                            >
                              <Link href={href}>



                                <span
                                  className={cn(isOpen === false ? "" : "mr-1.5")}
                                >
                                  <Icon width={24} height={24} />
                                </span>
                                <p
                                  className={cn(
                                    "max-w-[200px] truncate",
                                    isOpen === false
                                      ? "-translate-x-96 opacity-0"
                                      : "translate-x-0 opacity-100"
                                  )}
                                >
                                  {label}
                                </p>
                                {label === "Personal Details" && personalIncomplete && (
                                  <div
                                    className={cn(
                                      "absolute right-5 w-2 h-2 bg-[#89632F] rounded-full",
                                      isOpen === false ? "hidden" : "block"
                                    )}
                                  />
                                )}
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          {isOpen === false && (
                            <TooltipContent side="right">
                              {label}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ) : (
                    // <div className="w-full" key={index}>
                    //   <CollapseMenuButton
                    //     icon={Icon}
                    //     label={label}
                    //     active={active}
                    //     submenus={submenus}
                    //     isOpen={isOpen}
                    //   />
                    // </div>
                    <ExpandableLinkMenu
                      key={index}
                      href={href}
                      label={label}
                      icon={Icon}
                      active={active}
                      submenus={submenus}
                      isOpen={isOpen}
                    />
                  )
              )}
            </li>
          ))}
          <li className="w-full grow flex items-end overflow-visible [&>div>div]:overflow-visible">

            {isUpgraded ? (
              <div
                className="
                relative flex flex-col w-full 
                bg-[#151515] text-white
                p-6 rounded-xl
              "
              >
                <h2 className="flex items-center font-black text-[20px] mb-2 tracking-tight">
                  <span className="leading-none">GRANTON</span>
                  <Plus className="size-[15px]" strokeWidth={4} />
                </h2>
                <p className="text-[15px] font-medium leading-snug mb-4 text-white/60">
                  Thanks for being a premium member. Enjoy unlimited grant matches and priority support.
                </p>
                <Button
                  className="bg-[#1b1b1b] text-white/50 font-bold h-11 rounded-lg"
                  disabled
                >
                  Upgraded
                </Button>
              </div>

            ) : (
              // ─── User is not upgraded: teal background + shadow, active "Upgrade" button
              <div
                className="
              relative flex flex-col w-full 
              bg-[#68FCF2] text-black 
              p-6 rounded-xl
              shadow-[0_0_20px_3px_rgba(104,252,242,0.5)]
            "
              >
                <h2 className="flex flex-row items-center font-black text-[20px] mb-2 tracking-tight">
                  <span className="leading-none">GRANTON</span> <Plus className="size-[15px]" strokeWidth={4} />
                </h2>
                <p className="text-[15px] font-medium leading-snug mb-4">
                  Get real-time matches to grants and other funding opportunities based on your business & goals
                </p>
                <Button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="bg-black text-white font-bold h-11 rounded-lg">
                  Upgrade
                </Button>
              </div>
            )}

          </li>
        </ul>
      </nav>

    </>
  );
}
