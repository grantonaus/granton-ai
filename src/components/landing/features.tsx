"use client";

import { motion } from "framer-motion";
import { Search, Database, MapPin } from "lucide-react";

const features = [
    {
        icon: Search,
        tag: "Smart Technology",
        title: "AI-Powered Matching",
        description:
            "Our advanced algorithm analyzes your business profile to find the most relevant grants from federal and state databases.",
    },
    {
        icon: Database,
        tag: "Complete Coverage",
        title: "Comprehensive Database",
        description:
            "Access to 500+ Australian government grants, updated daily with new opportunities and closing dates.",
    },
    {
        icon: MapPin,
        tag: "Local Opportunities",
        title: "Location-Based Matching",
        description:
            "Find federal grants plus state-specific opportunities for NSW, VIC, QLD, WA, SA, TAS, ACT, and NT.",
    },
];

export default function FeaturesSection() {
    return (
        <section className="relative w-full overflow-hidden flex flex-col items-center text-center px-5 py-24">

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


            <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="shadow-[0_0_18px_rgba(104,252,242,0.15)] mx-auto mb-8 text-md flex max-w-fit items-center justify-center space-x-2 overflow-hidden rounded-full border border-[#68FCF2]/20 bg-[#191C1C] px-3 py-1 transition-all"
            >
                <span className="text-md font-bold text-[#24bbb1]">Powerful Features</span>
            </motion.div>


            <motion.h1
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="mt-2 text-5xl font-bold tracking-tight text-white sm:text-6xl"
            >
                Everything you need to{" "}
                <span className="text-[#77F7CF]">win grants</span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="mt-6 max-w-3xl font-medium text-[19px] sm:text-xl text-[#8e8e8e] sm:leading-normal"
            >
                Our comprehensive platform combines cutting-edge technology with
                expert knowledge to give you the best chance of securing funding.
            </motion.p>

            {/* Feature Cards */}
            <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3 w-full max-w-6xl mx-auto">
                {features.map((item, index) => {
                    const Icon = item.icon;

                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.08 }}
                            whileHover={{
                                boxShadow: "0px 20px 50px rgba(0,0,0,0.55)", // deeper shadow
                                borderColor: "rgba(255,255,255,0.15)",       // border brighten
                            }}
                            className="
                                relative group
                                flex flex-col items-start
                                rounded-lg p-7
                                bg-[#0C0C0C]
                                border border-white/10
                                shadow-2xl
                                overflow-hidden
                                transition-all duration-300
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

                            {/* Diagonal Light Streak */}
                            <div className="
                                absolute -top-10 -right-10 rotate-45
                                w-40 h-[2px]
                                bg-gradient-to-r from-transparent via-[#77F7CF]/40 to-transparent
                                opacity-0 group-hover:opacity-100
                                transition-all duration-700
                            " />

                            {/* Icon */}
                            <div className="relative w-12 h-12 rounded-xl bg-[#0f1a16] flex items-center justify-center mb-5">
                                <div className="absolute inset-0 rounded-xl bg-[#77F7CF]/20 blur-lg"></div>
                                <Icon className="relative text-[#77F7CF]" size={24} />
                            </div>

                            {/* Tag */}
                            <span className="
                                text-xs md:text-sm font-medium px-2 py-1 rounded-md
                                bg-white/5 border border-white/10 text-[#77F7CF]
                            ">
                                {item.tag}
                            </span>

                            {/* Title (left aligned) */}
                            <h3 className="mt-3 text-xl font-semibold text-white tracking-tight text-left w-full">
                                {item.title}
                            </h3>

                            {/* Description */}
                            <p className="mt-2 text-[16px] text-gray-400 font-medium text-left leading-relaxed">
                                {item.description}
                            </p>
                        </motion.div>
                    );
                })}
            </div>

        </section>
    );
}