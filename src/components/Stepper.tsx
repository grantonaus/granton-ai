"use client";

import { FC } from "react";
import React from "react";

const defaultSteps = [
  // "Company Details",
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
    <nav aria-label="Progress" className="w-full pt-4 pb-4 px-8">
      <div className="xl:flex hidden items-center w-full">
        {steps.map((title, idx) => {
          const step = idx + 1;
          const reached = step <= currentStep;
          const active = step === currentStep;

          return (
            <React.Fragment key={step}>
              <button
                onClick={() => step < currentStep && onStepClick(step)}
                className={
                  `flex items-center px-[10px] py-[10px] rounded-md
                transition-all duration-500 ease-in-out flex-shrink-0
                ${active ? "bg-[#191C1C]/60" : ""} 
                ${reached ? "hover:bg-[#68FCF2]/5" : ""}
              `}
              >
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

              {idx < steps.length - 1 && (
                <div
                  className={`
      h-[2px] rounded flex-1 mx-4
      ${step < currentStep ? "bg-[#68FCF2]" : "bg-[#202020]"} 
    `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex xl:hidden w-full h-2 space-x-2">
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
