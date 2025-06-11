"use client";

import Link from "next/link";
import { Ellipsis, LogOut, Plus, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import React from 'react';
import { getMenuList, RecentApp } from "@/constants/menuList";
import { ExpandableLinkMenu } from "./ExpandableLinkMenu";
import { loadStripe } from "@stripe/stripe-js";
import { useCurrentUser } from "@/hooks/user";

interface MenuProps {
  isOpen: boolean | undefined;
  personalIncomplete?: boolean;
  isPremium: boolean;  
}

export function Menu({
  isOpen,
  personalIncomplete,
  isPremium,            
}: MenuProps) {
  const pathname = usePathname();
  const { session } = useCurrentUser();


  const [loading, setLoading] = useState(false);

  const [recentApps, setRecentApps] = useState<RecentApp[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);

  useEffect(() => {
    async function loadRecentApps() {
      setLoadingApps(true);
      try {
        const res = await fetch("/api/applications");
        if (!res.ok) {
          console.error("Failed to fetch applications:", res.status);
          return;
        }
        const json = await res.json();
        // API gives you { applications: [...] }
        if (Array.isArray(json.applications)) {
          setRecentApps(json.applications as RecentApp[]);
        }
      } catch (err) {
        console.error("Error fetching applications:", err);
      } finally {
        setLoadingApps(false);
      }
    }

    loadRecentApps();
  }, [session?.user?.id]);

  const menuList = getMenuList(pathname, recentApps);


  // const [isUpgraded, setIsUpgraded] = useState(false);

  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

  const handleClick = async () => {
    const res = await fetch('/api/stripe/create-session', {
      method: 'POST',
    });

    const { url } = await res.json();
    const stripe = await stripePromise;

    if (!stripe || !url) return;

    // Just go to the checkout session URL
    window.location.href = url;
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

          {isPremium ? (
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
                {/* <a className="w-full" href="https://buy.stripe.com/test_8x200k5l99B6b8qePA0sU00"> */}
                <Button
                  // onClick={handleUpgrade}
                  // disabled={loading}
                  onClick={handleClick}
                  className="w-full bg-black text-white font-bold h-11 rounded-lg">
                  Upgrade
                </Button>
                {/* </a> */}
              </div>
            )}

          </li>
        </ul>
      </nav>

    </>
  );
}
