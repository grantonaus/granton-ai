"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const steps = [
    {
        id: 1,
        number: "01",
        title: "Create Your Profile",
        time: "2 minutes",
        description:
            "Tell us about your business – industry, location, stage, funding needs, and growth plans.",
    },
    {
        id: 2,
        number: "02",
        title: "AI Analysis",
        time: "Instant",
        description:
            "Our intelligent system analyzes 500+ grants and finds the best matches for your unique profile.",
    },
    {
        id: 3,
        number: "03",
        title: "Get Matched",
        time: "Real-time",
        description:
            "Receive a curated list of relevant grants with eligibility requirements and application deadlines.",
    },
    {
        id: 4,
        number: "04",
        title: "Apply & Track",
        time: "Ongoing",
        description:
            "Use our tools to track applications, set reminders, and monitor your success rate.",
    },
];

export default function HowItWorks() {
    return (
        <section className="relative w-full max-w-5xl overflow-hidden flex flex-col items-center text-center px-5 py-24">
            {/* Badge */}
            <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="shadow-[0_0_18px_rgba(104,252,242,0.15)] mx-auto mb-8 text-md flex max-w-fit items-center justify-center space-x-2 overflow-hidden rounded-full border border-[#68FCF2]/20 bg-[#191C1C] px-3 py-1 transition-all"
            >
                <span className="text-md font-bold text-[#24bbb1]">How It Works</span>
            </motion.div>

            {/* Heading */}
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

            {/* Steps Grid - Full Width Container on Desktop */}
            <div className="mt-16 w-full max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, y: 0 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: index * 0.1 }}
                            whileHover={{
                                boxShadow: "0px 20px 50px rgba(0,0,0,0.55)",
                                borderColor: "rgba(119,247,207,0.3)",
                                transform: "translateY(-4px)",
                            }}
                            className="
                                relative group
                                flex flex-col
                                rounded-xl p-6
                                bg-[#0C0C0C]
                                border border-white/10
                                shadow-2xl
                                overflow-hidden
                                transition-all duration-300
                                h-full
                            "
                        >
                            {/* Teal accent stripe */}
                            <div className="
                                absolute left-0 top-0 h-full w-[3px]
                                bg-gradient-to-b from-[#77F7CF] to-transparent opacity-70
                            " />

                            {/* Inner glow */}
                            <div className="
                                absolute inset-0 
                                bg-gradient-to-br from-[#77F7CF]/5 via-transparent to-transparent 
                                opacity-40 blur-xl
                            " />

                            {/* Diagonal Light Streak on Hover */}
                            <div className="
                                absolute -top-10 -right-10 rotate-45
                                w-40 h-[2px]
                                bg-gradient-to-r from-transparent via-[#77F7CF]/40 to-transparent
                                opacity-0 group-hover:opacity-100
                                transition-all duration-700
                            " />

                            {/* Number Badge */}
                            <div className="relative flex items-center justify-center mb-4">
                                <div className="
                                    w-16 h-16 rounded-full
                                    bg-gradient-to-br from-[#77F7CF]/20 to-[#77F7CF]/5
                                    border border-[#77F7CF]/30
                                    flex items-center justify-center
                                    relative
                                ">
                                    <div className="absolute inset-0 rounded-full bg-[#77F7CF]/20 blur-lg"></div>
                                    <span className="relative text-2xl font-bold text-[#77F7CF]">
                                        {step.number}
                                    </span>
                                </div>
                            </div>

                            {/* Time Badge */}
                            <div className="mb-3">
                                <span className="
                                    inline-flex items-center gap-1.5
                                    text-xs font-medium px-2.5 py-1 rounded-md
                                    bg-white/5 border border-white/10 text-[#77F7CF]
                                ">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {step.time}
                                </span>
                            </div>

                            {/* Title */}
                            <h3 className="
                                text-xl font-semibold text-white tracking-tight
                                mb-3
                                group-hover:text-[#77F7CF]
                                transition-colors duration-300
                            ">
                                {step.title}
                            </h3>

                            {/* Description */}
                            <p className="
                                text-[15px] text-gray-400 font-medium
                                leading-relaxed
                                flex-grow
                            ">
                                {step.description}
                            </p>

                            {/* Connecting Line (hidden on last item in row and mobile) */}
                            {index < steps.length - 1 && index % 2 === 0 && (
                                <div className="
                                    hidden md:block
                                    absolute -right-3 top-1/2 -translate-y-1/2
                                    w-6 h-[2px]
                                    bg-gradient-to-r from-[#77F7CF]/40 to-transparent
                                " />
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}