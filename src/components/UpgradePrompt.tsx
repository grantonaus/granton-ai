"use client";

import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { UpgradePlanDialog } from "@/components/UpgradePlanDialog";

interface UpgradePromptProps {
  title?: string;
  description?: string;
}

export default function UpgradePrompt({
  title = "Upgrade to Pro",
  description = "Subscribe to access AI-powered grant matching and premium features",
}: UpgradePromptProps) {
  return (
    <div className="w-full flex items-center justify-center px-5 py-8">
      <div className="max-w-md w-full">
        <div className="bg-[#0F0F0F] border border-[#264e42] rounded-xl p-6 shadow-[0_0_20px_rgba(119,247,207,0.15)]">
          <div className="bg-[#143735] flex flex-col items-center justify-center size-14 rounded-full mb-5 mx-auto">
            <Sparkles className="size-8 text-[#77F7CF]" />
          </div>
          <h2 className="text-xl font-bold text-white text-center mb-2">
            {title}
          </h2>
          <p className="text-gray-400 text-center text-sm mb-6">
            {description}
          </p>
          <UpgradePlanDialog>
            <Button
              type="button"
              className="w-full h-10 bg-[#77F7CF] hover:bg-[#77F7CF]/80 text-black font-semibold text-sm shadow-[0_0_15px_rgba(119,247,207,0.3)]"
            >
              Upgrade to Pro
            </Button>
          </UpgradePlanDialog>
        </div>
      </div>
    </div>
  );
}
