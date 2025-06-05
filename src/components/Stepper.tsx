"use client";

import { FC } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const defaultSteps = [
  "Company Details",
  "Grant Details",
  "Budget",
  "Additional Questions",
  "Finalise",
];

interface StepTrackerProps {
  steps?: string[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

export const StepTracker: FC<StepTrackerProps> = ({
  steps = defaultSteps,
  currentStep,
  onStepClick,
}) => {
  const lastStep = steps.length;
  return (
    <nav aria-label="Progress" className="w-full max-w-[960px] mx-auto pt-7 pb-4">
      <div className="xl:flex hidden items-center justify-between">
        {steps.map((title, idx) => {
          const step = idx + 1;
          const reached = step <= currentStep;
          const active = step === currentStep;

          return (
            <div key={step} className="flex items-center">
              <button
                onClick={() => step < currentStep && onStepClick(step)}
                className={
                  `flex items-center px-[10px] py-[10px] rounded-md
                transition-all duration-500 ease-in-out flex-shrink-0
                ${active ? "bg-[#191C1C]/60" : ""} 
                ${reached ? "hover:bg-[#68FCF2]/5" : ""}
              `}
              // ${active ? "bg-[#191C1C]" : ""} 
              >
                {/* number bubble */}
                <div
                  className={
                    `flex items-center justify-center
                  w-6 h-6 rounded-sm text-sm font-semibold
                  transition-all duration-500 ease-in-out flex-shrink-0
                  ${reached
                      ? "bg-[#68FCF2] text-black"
                      : "bg-[#161616] text-[#6D6D6D]"
                    }
                `}
                >
                  {step}
                </div>

                {/* title */}
                <span
                  className={`
                  ml-2 text-sm font-semibold
                  transition-all duration-500 ease-in-out
                  ${reached ? "text-[#68FCF2]" : "text-[#6D6D6D]"}
                `}
                >
                  {title}
                </span>
              </button>

              {/* arrow between steps */}
              {idx < steps.length - 1 && (
                // <ChevronRight
                //   className={
                //     mx-2 transition-all duration-500 ease-in-out
                //     ${reached ? "text-[#202020]" : "text-[#202020]"}
                //   }
                //   size={16}
                //   strokeWidth={3}
                // />

                // <div className="w-4 lg:w-7  h-[2px] rounded bg-[#202020] mx-4" />
                <div
                  className={`
      h-[2px] rounded 
      ${step < currentStep ? "bg-[#68FCF2]" : "bg-[#202020]"} 
      mx-4 w-4 lg:w-7
    `}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* MOBILE: 5 boxes */}
      {/* MOBILE: equal-width bars */}
      <div className="flex xl:hidden w-full h-1 space-x-2">
        {steps.map((_, idx) => {
          const step = idx + 1;
          const reached = step <= currentStep;
          return (
            <button
              key={step}
              onClick={() => reached && onStepClick(step)}
              className={
                `flex-1 h-full rounded-md transition-colors duration-300 ease-in-out ` +
                `${reached ? "bg-[#68FCF2]" : "bg-[#161616]"}`
              }
            />
          );
        })}
      </div>
    </nav>
  );
};
