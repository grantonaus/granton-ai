"use client";

import Link from "next/link";
import { Ellipsis, LogOut, Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth-client-custom";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import React from "react";
import { getMenuList } from "@/constants/menuList";
import { ExpandableLinkMenu } from "./ExpandableLinkMenu";

interface MenuProps {
  isOpen: boolean | undefined;
  personalIncomplete?: boolean;
  companyIncomplete?: boolean;
  onLinkClick?: () => void;
  isSubscribed?: boolean;
}

export function Menu({
  isOpen,
  personalIncomplete,
  companyIncomplete,
  onLinkClick,
  isSubscribed = false,
}: MenuProps) {
  const pathname = usePathname();
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  const menuList = getMenuList(pathname);


  return (
    <>
      {/* <ScrollArea className="overflow-visible [&>div>div]:overflow-visible"> */}
      <nav className="md:mt-7 h-full w-full overflow-visible [&>div>div]:overflow-visible">
        <ul className="flex flex-col min-h-[calc(100vh-48px-36px-16px-60px)] lg:min-h-[calc(100vh-32px-40px-60px)] items-start space-y-0.5 px-2 overflow-visible [&>div>div]:overflow-visible">
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
                ({ href, label, icon: Icon, active, submenus }, index) => {
                  const isMobile = onLinkClick !== undefined;
                  const shouldRenderAsSimpleLink = submenus.length === 0;
                  
                  return shouldRenderAsSimpleLink ? (
                    <div className="w-full" key={index}>
                      <TooltipProvider disableHoverableContent>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <Button
                              variant={active ? "secondary" : "ghost"}
                              className="relative w-full justify-start font-medium text-[15px] h-11 mb-1.5  py-0 rounded-md"
                              asChild
                            >
                              <Link href={href} onClick={onLinkClick}>



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
                                {/* {label === "Personal Details" && personalIncomplete && ( */}
                                {((label === "Personal Details" && personalIncomplete) ||
                                  (label === "Company Details" && companyIncomplete)) && (
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
                      onLinkClick={onLinkClick}
                    />
                  );
                }
              )}
            </li>
          ))}
          <li className="w-full grow flex items-end overflow-visible [&>div>div]:overflow-visible">
            {isSubscribed ? (
              <div
                className="relative flex flex-col w-full bg-[#151515] text-white p-4 rounded-xl"
              >
                <h2 className="flex items-center font-black text-[20px] mb-2 tracking-tight">
                  <span className="leading-none">GRANTON</span>
                  <Plus className="size-[13px]" strokeWidth={4} />
                </h2>
                <p className="text-[15px] font-medium leading-snug mb-4 text-white/60">
                  You&apos;re a premium member! Enjoy unlimited AI-powered grant matches, priority support, and exclusive features.
                </p>
                <Button
                  className="bg-[#1b1b1b] text-white/50 font-bold h-11 rounded-lg text-[15px]"
                  disabled
                >
                  Active
                </Button>
              </div>
            ) : (
              <div
                className="relative flex flex-col w-full bg-[#68FCF2] text-black p-4 rounded-xl shadow-[0_0_20px_3px_rgba(104,252,242,0.5)]"
              >
                <h2 className="flex flex-row items-center font-black text-[20px] mb-2 tracking-tight">
                  <span className="leading-none">GRANTON</span> <Plus className="size-[13px]" strokeWidth={4} />
                </h2>
                <p className="text-[15px] font-medium leading-snug mb-4">
                  Unlock AI-powered grant discovery. Get instant matches tailored to your business profile and funding goals.
                </p>
                <Button
                  onClick={async () => {
                    try {
                      setUpgradeLoading(true);
                      const response = await fetch('/api/subscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isAnnual: false }),
                      });
                      const data = await response.json();
                      if (data.url) {
                        window.location.href = data.url;
                      } else {
                        console.error('No checkout URL received');
                      }
                    } catch (error) {
                      console.error('Error creating checkout:', error);
                    } finally {
                      setUpgradeLoading(false);
                    }
                  }}
                  disabled={upgradeLoading}
                  className="w-full bg-black hover:bg-black/80 text-white font-bold h-11 rounded-lg cursor-pointer text-[15px]"
                >
                  {upgradeLoading ? "Loading..." : "Upgrade"}
                </Button>
              </div>
            )}
          </li>
          {/* {session?.user && ( */}
          <li className="w-full mt-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="w-full bg-[#1a1a1a] hover:bg-[#111111] text-white border border-white/5 font-semibold h-11 rounded-lg cursor-pointer flex items-center gap-2 justify-center transition-colors duration-200"
                >
                  <LogOut size={18} />
                  Logout
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="my-0">Confirm Logout</AlertDialogTitle>
                  <AlertDialogDescription className="my-0">
                    Are you sure you want to log out? This will end your session and
                    redirect you to the login page.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="h-10 hover:bg-[#131313] hover:text-white/80 cursor-pointer">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      try {
                        await signOut();
                        window.location.href = "/login";
                      } catch (error) {
                        console.error("Logout failed:", error);
                      }
                    }}
                    className="h-10 bg-destructive hover:bg-destructive/80 text-white cursor-pointer"
                  >
                    Log out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </li>
          {/* )} */}
        </ul>
      </nav>

    </>
  );
}
