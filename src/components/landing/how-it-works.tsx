"use client";

import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

const steps = [
    {
        id: 1,
        title: "Create Your Profile",
        time: "2 minutes",
        description:
            "Tell us about your business – industry, location, stage, funding needs, and growth plans.",
    },
    {
        id: 2,
        title: "AI Analysis",
        time: "Instant",
        description:
            "Our intelligent system analyzes 500+ grants and finds the best matches for your unique profile.",
    },
    {
        id: 3,
        title: "Get Matched",
        time: "Real-time",
        description:
            "Receive a curated list of relevant grants with eligibility requirements and application deadlines.",
    },
    {
        id: 4,
        title: "Apply & Track",
        time: "Ongoing",
        description:
            "Use our tools to track applications, set reminders, and monitor your success rate.",
    },
];

export default function HowItWorks() {
    return (
        <section className="relative w-full overflow-hidden flex flex-col items-center text-center px-5 py-24">
            {/* Heading */}
        

            <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="shadow-[0_0_18px_rgba(104,252,242,0.15)] mx-auto mb-8 text-md flex max-w-fit items-center justify-center space-x-2 overflow-hidden rounded-full border border-[#68FCF2]/20 bg-[#191C1C] px-3 py-1 transition-all"
            >
                <span className="text-md font-bold text-[#24bbb1]">How It Works</span>
            </motion.div>


            <motion.h1
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="mt-2 text-5xl font-bold tracking-tight text-white sm:text-6xl"
            >
                 From profile to <span className="text-[#77F7CF]">funding</span> in 4 steps
            </motion.h1>

            {/* Subtext */}
            <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="mt-6 max-w-3xl font-medium text-[19px] sm:text-xl text-[#8e8e8e] sm:leading-normal"
            >
                Our streamlined process gets you from business profile to grant applications
                in minutes, not weeks.
            </motion.p>

            {/* Steps */}
            {/* <div className="mt-20 flex flex-col gap-24 max-w-5xl mx-auto px-6">
                {steps.map((step, index) => (
                    <div
                        key={step.id}
                        className={`
              flex flex-col md:flex-row items-center gap-10
              ${index % 2 === 1 ? "md:flex-row-reverse" : ""}
            `}
                    >

                        <div className="flex flex-col items-center md:items-start">
                            <div className="h-20 w-20 rounded-full bg-[#77F7CF]/10 border border-[#77F7CF]/30 flex items-center justify-center">
                                <span className="text-3xl font-bold text-[#77F7CF]">
                                    {step.id}
                                </span>
                            </div>


                            {index < steps.length - 1 && (
                                <ArrowDown className="hidden md:block mt-6 text-gray-700 size-7 mx-auto" />
                            )}
                        </div>


                        <div className="flex-1 text-center md:text-left">
                            <p className="text-sm font-semibold text-gray-400 mb-1">
                                {step.time}
                            </p>

                            <h3 className="text-2xl font-semibold text-white">
                                {step.title}
                            </h3>

                            <p className="mt-3 text-gray-300 text-lg leading-relaxed max-w-md mx-auto md:mx-0">
                                {step.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div> */}
        </section>
    );
}