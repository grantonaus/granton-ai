"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "../ui/button";

const CTA: React.FC = () => {
  return (
    <section id="cta" className="relative w-full mt-24 pb-12 text-white isolate overflow-hidden">




      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="]
          relative mx-auto max-w-6xl px-8 py-20 rounded-xl
          border-2 border-white/10
          backdrop-blur-2xl
          bg-[#0F0F0F]/70
          shadow-[0_20px_70px_rgba(0,0,0,0.65)]
          overflow-hidden
        "
      >


        {/* Subtle Teal Ring */}
        <div className="
          absolute inset-0 rounded-xl pointer-events-none
          ring-2 ring-transparent
          group-hover:ring-[#77F7CF]/30 transition-all
        " />


        {/* Floating bottom circle (faint) */}
        <div className="
          absolute -bottom-20 left-1/2 -translate-x-1/2
          w-[300px] h-[300px] rounded-full
          bg-[#77F7CF]/10 blur-3xl opacity-40
        " />

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >

          <h3
            className="
    mt-4 text-[38px] md:text-[50px] font-black leading-tight
    bg-gradient-to-b from-white to-white/30 bg-clip-text text-transparent
  "
          >
            Ready to find your perfect grants?
          </h3>

          <p className="mt-5 text-muted-foreground text-xl font-medium leading-normal">
            Join hundreds of Australian businesses who have already discovered their ideal funding opportunities.
          </p>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
          className="mt-8 flex items-center justify-center"
        >
          <Link href="/sign-up" className="relative group">

            {/* Soft surrounding glow */}
            <div className="
              absolute inset-0 rounded-xl bg-[#77F7CF]/20 blur-xl
              opacity-0 group-hover:opacity-100 transition-all duration-500
            " />

            {/* Big Aura Halo */}
            <div className="
              absolute -inset-1 rounded-xl
              bg-gradient-to-b from-[#77F7CF]/25 to-transparent
              opacity-0 group-hover:opacity-80 blur-2xl
              transition-all duration-700
            " />

            <Button
              className="
                cursor-pointer
                relative h-14 px-10 font-semibold text-black
                text-lg tracking-tight
                bg-[#77F7CF]
                hover:bg-[#77F7CF]/80
                transition-all duration-300
                shadow-[0_0_25px_rgba(119,247,207,0.45)]
              "
            >
              Get Matched Now
            </Button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Copyright */}
      <div className="mt-20 text-center text-[15px] md:text-md font-medium text-muted-foreground">
        © {new Date().getFullYear()} Grantly — All rights reserved.
      </div>
    </section>
  );
};

export default CTA;