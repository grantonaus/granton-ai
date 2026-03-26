"use client";

import { motion } from "framer-motion";
import { FileText, Database, Zap, ListChecks } from "lucide-react";
import { FEATURE_GRANT_WRITER_ENABLED } from "@/constants/feature-flags";

const grantWriterFeature = {
    icon: FileText,
    tag: "AI Technology",
    title: "AI Grant Writer",
    description:
        "Generate professional grant applications tailored to each opportunity using our advanced AI writer that understands grant requirements and your business profile.",
};

const shortlistFeature = {
    icon: ListChecks,
    tag: "Your workflow",
    title: "Shortlist & deadlines",
    description:
        "Save grants you care about, see eligibility at a glance, and track closing dates so nothing slips through while you prepare outside the app.",
};

const coreFeatures = [
    {
        icon: Database,
        tag: "Complete coverage",
        title: "Grant database",
        description:
            "Access to 200+ Australian government grants, updated with new opportunities, closing dates, and detailed eligibility requirements.",
    },
    {
        icon: Zap,
        tag: "Smart matching",
        title: "AI-powered matches",
        description:
            "Our system scores opportunities against your business profile so you see federal and state grants that fit—not a random list.",
    },
];

const features = FEATURE_GRANT_WRITER_ENABLED
    ? [grantWriterFeature, ...coreFeatures]
    : [shortlistFeature, ...coreFeatures];

export default function FeaturesSection() {
    return (
        <section className="relative flex w-full flex-col items-center overflow-hidden bg-[#0E0E0E] px-6 py-28 text-center sm:px-8 md:py-32">
            {/* Headline */}
            {/* <motion.div
          className="text-center max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <span className="text-[13px] font-medium text-[#77F7CF] tracking-wide uppercase">
            Powerful Features
          </span>

          <h2 className="mt-3 text-[34px] sm:text-[40px] font-bold leading-tight">
            Everything you need to{" "}
            <span className="text-[#77F7CF]">win grants</span>
          </h2>

          <p className="mt-4 text-gray-400 text-[17px] leading-relaxed">
            Our comprehensive platform combines cutting-edge technology with
            expert knowledge to give you the best chance of securing funding.
          </p>
        </motion.div> */}


            <div className="mx-auto max-w-xl text-center">
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="shadow-[0_0_18px_rgba(104,252,242,0.15)] mx-auto mb-8 flex max-w-fit items-center justify-center space-x-2 overflow-hidden rounded-full border border-[#68FCF2]/20 bg-[#191C1C] px-3 py-1 transition-all"
                >
                    <span className="text-md font-bold text-[#24bbb1]">
                        Powerful features
                    </span>
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="mt-2 text-5xl font-bold tracking-tight text-white sm:text-6xl"
                >
                    Everything you need to{" "}
                    <span className="text-[#68FCF2] drop-shadow-[0_0_12px_rgba(104,252,242,0.35)]">
                        win grants
                    </span>
                </motion.h2>
            </div>

            <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="mx-auto mt-6 max-w-2xl font-medium text-[19px] text-[#8e8e8e] sm:text-xl sm:leading-normal drop-shadow-[0_2px_10px_rgba(0,0,0,0.2)]"
            >
                {FEATURE_GRANT_WRITER_ENABLED
                    ? "Search, match, and draft from one place—built around Australian programs."
                    : "Search and match Australian grants from one place—database, scoring, and a clear path to what you’ll apply for."}
            </motion.p>

            {/* Feature Cards */}
            <div className="mx-auto mt-16 grid w-full max-w-6xl grid-cols-1 gap-6 md:mt-20 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
                {features.map((item, index) => {
                    const Icon = item.icon;
                    const tone =
                        index === 0
                            ? "border-[#68FCF2]/12 bg-[#0c1010]"
                            : index === 1
                              ? "border-white/[0.07] bg-[#101010]"
                              : "border-white/[0.07] bg-[#0e0e0e]";

                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 8 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.35, delay: index * 0.06 }}
                            className={`group flex flex-col items-start rounded-xl border p-6 transition-colors duration-200 hover:border-white/[0.12] sm:p-8 ${tone}`}
                        >
                            <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-md border border-[#68FCF2]/18 bg-[#68FCF2]/[0.05] text-[#8ae8df] sm:h-11 sm:w-11">
                                <Icon className="size-5 sm:size-[22px]" strokeWidth={1.75} aria-hidden />
                            </div>

                            <span className="rounded border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">
                                {item.tag}
                            </span>

                            <h3 className="mt-4 w-full text-left text-xl font-semibold tracking-tight text-white">
                                {item.title}
                            </h3>

                            <p className="mt-3 text-left text-base font-medium leading-relaxed text-gray-400 sm:text-[17px]">
                                {item.description}
                            </p>
                        </motion.div>
                    );
                })}
            </div>

        </section>
    );
}