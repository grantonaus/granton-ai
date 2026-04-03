"use client";

import { useState, type ReactNode } from "react";
import { X } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import PlanCard from "@/components/landing/plan-card";
import SwitchToggle from "@/components/landing/switch-toggle";

const STARTER_FEATURES = [
  "Access to grant database",
  "Basic search and filtering",
  "Browse all available grants",
  "No AI matching",
];

const PRO_FEATURES = [
  "Everything in Starter",
  "Unlimited grant matching",
  "AI application generator",
  "Location-based matching",
  "Priority email support",
];

interface UpgradePlanDialogProps {
  children: ReactNode;
}

/**
 * Plan picker in a bottom drawer (new subscribers).
 */
export function UpgradePlanDialog({ children }: UpgradePlanDialogProps) {
  const [open, setOpen] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="bottom-0 left-0 right-0 max-h-[min(92dvh,920px)] w-full max-w-none translate-x-0 gap-0 rounded-t-2xl border border-white/5 bg-[#0E0E0E] p-0 sm:left-1/2 sm:right-auto sm:w-[calc(100%-2rem)] sm:max-w-6xl sm:-translate-x-1/2 md:w-[calc(100%-3rem)]">
        <div className="flex max-h-[min(92dvh,920px)] flex-col overflow-hidden">
          {/* <div className="flex shrink-0 items-center justify-end border-b border-white/5 px-4 pb-2 pt-1 sm:px-6">
            <DrawerClose
              className="rounded-md p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#68FCF2]/40"
              aria-label="Close"
            >
              <X className="size-7" strokeWidth={2} />
            </DrawerClose>
          </div> */}

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="relative isolate w-full px-4 pb-8 pt-2 sm:px-8 sm:pb-10 sm:pt-4">
              <DrawerHeader className="space-y-2 px-0 pb-0 pt-0 text-center sm:text-center">
                <DrawerTitle className="pt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Upgrade to Grantly+
                </DrawerTitle>
                <DrawerDescription className="px-4 md:px-0 max-w-2xl mx-auto text-[16px] leading-relaxed font-medium text-gray-500 sm:text-[17px]">
                  Grantly+ matches funding to your story,
                  and puts you first when you need help, so you
                  can spend less time searching and more time getting funded.
                </DrawerDescription>
              </DrawerHeader>

              <div className="mx-auto mt-5 flex flex-col items-center gap-1.5">
                <div className="flex items-center justify-center gap-3">
                  <span
                    className={`text-sm font-medium leading-none ${!isAnnual ? "text-white" : "text-gray-500"}`}
                  >
                    Monthly
                  </span>
                  <span className="inline-flex shrink-0 items-center">
                    <SwitchToggle isAnnual={isAnnual} setIsAnnual={setIsAnnual} />
                  </span>
                  <span
                    className={`text-sm font-medium leading-none ${isAnnual ? "text-white" : "text-gray-500"}`}
                  >
                    Annual
                  </span>
                </div>
                <span
                  className={`min-h-4 text-center text-xs font-medium text-[#68FCF2] transition-opacity ${isAnnual ? "opacity-100" : "pointer-events-none opacity-0"}`}
                  aria-hidden={!isAnnual}
                >
                  Save 20%
                </span>
              </div>

              <div className="mx-auto mt-8 grid max-w-lg grid-cols-1 gap-8 md:mt-8 md:max-w-none md:grid-cols-2 md:gap-6 lg:gap-8">
                <PlanCard
                  title="Starter"
                  description="Explore the grant database"
                  monthlyPrice={0}
                  annualPrice={0}
                  href="/grant-database"
                  features={STARTER_FEATURES}
                  isAnnual={isAnnual}
                  shape="default"
                />
                <div className="md:-mt-4">
                  <PlanCard
                    title="Pro"
                    description="Unlock intelligent grant matching"
                    monthlyPrice={29}
                    annualPrice={300}
                    paymentLink="/api/stripe/checkout"
                    href="/grant-database"
                    features={PRO_FEATURES}
                    isAnnual={isAnnual}
                    isSubscribed={false}
                    highlight
                    shape="default"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
