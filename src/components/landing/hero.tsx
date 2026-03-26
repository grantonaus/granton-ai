"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { FEATURE_GRANT_WRITER_ENABLED } from "@/constants/feature-flags";

export default function Hero() {
    return (
        <section className="relative w-full overflow-hidden flex flex-col items-center text-center px-5 pt-52 pb-10">

            {/* <div className="absolute top-28 md:top-40 left-4/12 size-72 sm:size-96 xl:size-120 2xl:size-132 bg-[#143735] blur-[100px] opacity-30"></div> */}


            <motion.div
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="shadow-[0_0_18px_rgba(104,252,242,0.15)] mx-auto mb-8 text-md flex max-w-fit items-center justify-center space-x-2 overflow-hidden rounded-full border border-[#68FCF2]/20 bg-[#191C1C] px-3 py-1 transition-all"
            >
                <span className="text-md font-bold text-[#24bbb1]">🇦🇺 Australian Grant Database</span>
            </motion.div>

            {/* Heading */}
            <motion.h1
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="pb-8 max-w-5xl text-[40px] sm:text-[56px] md:text-[72px] font-black leading-[1.02] md:leading-[0.95] bg-gradient-to-b from-white to-white/20 bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
            >
                Find the perfect{" "}
                <span className="text-[#68FCF2] drop-shadow-[0_0_12px_rgba(104,252,242,0.35)]">
                    grants
                </span>{" "}
                for your business
            </motion.h1>

            {/* Subtext */}
            <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="max-w-3xl font-medium text-[19px] sm:text-xl text-[#8e8e8e] sm:leading-normal drop-shadow-[0_2px_10px_rgba(0,0,0,0.2)]"
            >
                Stop wasting time searching through hundreds of grant programs.{" "}
                {FEATURE_GRANT_WRITER_ENABLED
                    ? "Our AI-powered platform matches your business to the most relevant federal and state grants—and helps you draft applications when you’re ready."
                    : "Search federal and state opportunities in one place—then match your business to what you can actually apply for."}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className=" flex flex-col md:flex-row items-center justify-center gap-4 mt-10"
            >
                <Link href="/sign-up">
                    <Button className="cursor-pointer flex flex-row items-center justify-center h-14 px-5 text-md md:text-lg font-bold bg-[#68FCF2] text-black hover:bg-[#68FCF2]/80 shadow-[0_0_20px_rgba(104,252,242,0.3)]">
                        Get Matched Now <ArrowRight className="size-6" />
                    </Button>
                </Link>

                <Button className="cursor-pointer flex flex-row items-center h-14 px-5 text-md md:text-lg font-semibold bg-[#121212] border border-[#2a2a2a] text-white hover:bg-[#171717] shadow-[0_4px_15px_rgba(0,0,0,0.4)]">
                    Discuss with Consultant
                </Button>
            </motion.div>


            <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="italic mt-10 max-w-3xl font-medium text-[14px] sm:text-[16px] text-muted-foreground sm:leading-normal"
            >
                Grantly by Granton
            </motion.p>
        </section>
    );
}