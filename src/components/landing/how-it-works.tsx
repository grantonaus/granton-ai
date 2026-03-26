"use client";

import { motion } from "framer-motion";
import {
    ChevronDown,
    ChevronRight,
    FileEdit,
    ListChecks,
    Sparkles,
    UserRound,
} from "lucide-react";
import { FEATURE_GRANT_WRITER_ENABLED } from "@/constants/feature-flags";
import { cn } from "@/lib/utils";

const stepsBase = [
    {
        id: 1,
        number: "01",
        title: "Create your profile",
        time: "2 minutes",
        description:
            "Tell us about your business—industry, location, stage, funding needs, and growth plans.",
    },
    {
        id: 2,
        number: "02",
        title: "AI analysis",
        time: "Instant",
        description:
            "We score your profile against 200+ programs and surface realistic matches from federal and state sources.",
    },
    {
        id: 3,
        number: "03",
        title: "Get matched",
        time: "Real-time",
        description:
            "Review a curated list with eligibility, fit, and deadlines so you know what to pursue first.",
    },
];

const stepApplyWithAi = {
    id: 4,
    number: "04",
    title: "Apply with AI",
    time: "Ongoing",
    description:
        "Use our AI application writer to generate professional drafts tailored to each grant.",
};

const stepIcons = [UserRound, Sparkles, ListChecks, FileEdit] as const;

function ProcessConnector({ rowFrom }: { rowFrom: "md" | "lg" }) {
    const vBreak = rowFrom === "md" ? "md" : "lg";
    return (
        <div
            className={cn(
                "flex shrink-0 flex-col items-center justify-center py-0.5",
                vBreak === "md" ? "md:flex-row md:px-0.5 md:py-0 lg:px-1" : "lg:flex-row lg:px-0.5 lg:py-0 xl:px-1"
            )}
            aria-hidden
        >
            <div
                className={cn(
                    "h-10 w-px bg-gradient-to-b from-[#68FCF2]/25 via-[#68FCF2]/10 to-transparent",
                    vBreak === "md" ? "md:hidden" : "lg:hidden"
                )}
            />
            <ChevronDown
                className={cn(
                    "-mt-1 size-4 text-[#68FCF2]/35",
                    vBreak === "md" ? "md:hidden" : "lg:hidden"
                )}
                strokeWidth={2}
            />
            <div
                className={cn(
                    "hidden h-px w-5 bg-gradient-to-r from-[#68FCF2]/28 via-[#68FCF2]/10 to-transparent sm:w-6",
                    vBreak === "md" ? "md:block" : "lg:block"
                )}
            />
            <ChevronRight
                className={cn(
                    "-ml-0.5 hidden size-4 shrink-0 text-[#68FCF2]/40",
                    vBreak === "md" ? "md:block" : "lg:block"
                )}
                strokeWidth={2}
            />
        </div>
    );
}

export default function HowItWorks() {
    const steps = FEATURE_GRANT_WRITER_ENABLED
        ? [...stepsBase, stepApplyWithAi]
        : stepsBase;

    const stepCount = steps.length;
    const stepWord = stepCount === 4 ? "four" : "three";

    return (
        <section className="relative flex w-full flex-col items-center overflow-hidden bg-[#0E0E0E] px-6 py-28 text-center sm:px-8 md:py-32">
            <div className="mx-auto max-w-3xl text-center">
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="shadow-[0_0_18px_rgba(104,252,242,0.15)] mx-auto mb-8 flex max-w-fit items-center justify-center space-x-2 overflow-hidden rounded-full border border-[#68FCF2]/20 bg-[#191C1C] px-3 py-1 transition-all"
                >
                    <span className="text-md font-bold text-[#24bbb1]">How it works</span>
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="mt-2 text-5xl font-bold tracking-tight text-white sm:text-6xl"
                >
                    From profile to{" "}
                    <span className="text-[#68FCF2] drop-shadow-[0_0_12px_rgba(104,252,242,0.35)]">
                        funding
                    </span>{" "}
                    in {stepWord} steps
                </motion.h2>
            </div>

            <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="mx-auto mt-6 max-w-2xl font-medium text-[19px] text-[#8e8e8e] sm:text-xl sm:leading-normal drop-shadow-[0_2px_10px_rgba(0,0,0,0.2)]"
            >
                {FEATURE_GRANT_WRITER_ENABLED
                    ? "From business profile to drafted applications—streamlined so you spend time on the right opportunities."
                    : "From profile to a ranked shortlist fast—then you apply through each program’s own process when it fits."}
            </motion.p>

            <div className="mt-16 w-full max-w-6xl md:mt-20">
                <div
                    className={cn(
                        "flex items-stretch",
                        stepCount === 3 &&
                            "flex-col gap-0 md:flex-row md:justify-center md:gap-0",
                        stepCount === 4 &&
                            "flex-col gap-0 lg:flex-row lg:justify-center lg:gap-0"
                    )}
                >
                    {steps.flatMap((step, index) => {
                        const Icon = stepIcons[index] ?? ListChecks;
                        const tone =
                            index === 0
                                ? "border-[#68FCF2]/12 bg-[#0c1010]"
                                : index === 1
                                  ? "border-white/[0.07] bg-[#101010]"
                                  : index === 2
                                    ? "border-white/[0.07] bg-[#0e0e0e]"
                                    : "border-white/[0.07] bg-[#111111]";

                        const card = (
                            <motion.article
                                key={step.id}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.35, delay: index * 0.05 }}
                                className={cn(
                                    "group flex min-w-0 flex-1 flex-col rounded-xl border p-5 text-left transition-colors duration-200 hover:border-white/[0.12] sm:p-6",
                                    tone
                                )}
                            >
                                <div className="mb-4 flex items-start justify-between gap-3 sm:mb-5">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-md border border-[#68FCF2]/18 bg-[#68FCF2]/[0.05] text-[#8ae8df] sm:h-12 sm:w-12">
                                        <Icon className="size-[22px] sm:size-6" strokeWidth={1.75} aria-hidden />
                                    </div>
                                    <span className="font-mono text-[11px] font-medium tabular-nums tracking-[0.18em] text-[#68FCF2]/45 sm:text-xs">
                                        {step.number}
                                    </span>
                                </div>

                                <span className="w-fit rounded border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">
                                    {step.time}
                                </span>

                                <h3 className="mt-4 text-xl font-semibold tracking-tight text-white transition-colors group-hover:text-[#a8f5ec] sm:text-2xl sm:leading-snug">
                                    {step.title}
                                </h3>

                                <p className="mt-3 text-base font-medium leading-relaxed text-gray-400 sm:text-[17px] sm:leading-relaxed">
                                    {step.description}
                                </p>
                            </motion.article>
                        );

                        if (index < steps.length - 1) {
                            return [
                                card,
                                <ProcessConnector
                                    key={`conn-${step.id}`}
                                    rowFrom={stepCount === 3 ? "md" : "lg"}
                                />,
                            ];
                        }
                        return [card];
                    })}
                </div>
            </div>
        </section>
    );
}
